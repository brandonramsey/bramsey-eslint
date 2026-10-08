/* eslint-disable no-await-in-loop, complexity, max-params -- This sequential experiment records evidence across isolated CLI fixtures. */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

import { createConfig, plugins } from '../../../src/index.js';
import { typedRules } from '../../../src/rules.js';
import { styleRules } from '../../../src/style-rules.js';

import { checkDescriptions } from './description-preflight.mjs';
import { createExportParser } from './export-parser.mjs';
import { behaviorCases, exportCases, fixCases, namingCases, namingPattern, styleCases, typedCases, typedControls } from './fixtures.mjs';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const toolRoot = resolve(process.argv[2] ?? '/private/tmp/bramsey-oxlint-candidate-tools');
const candidateRequire = createRequire(join(toolRoot, 'package.json'));
const { parseSync, visitorKeys } = await import(candidateRequire.resolve('oxc-parser'));
const descriptionParser = createExportParser(parseSync, visitorKeys);
const descriptionRule = (await import(candidateRequire.resolve('@eslint-community/eslint-plugin-eslint-comments'))).default.rules['require-description'];
const destination = resolve(process.argv[3] ?? fileURLToPath(new URL('./results.json', import.meta.url)));
const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'bramsey-oxlint-validation-')));
const root = join(scratch, 'project');
cpSync(join(repository, 'test/fixtures/project'), root, { recursive: true });
symlinkSync(join(toolRoot, 'node_modules'), join(root, 'node_modules'), 'dir');
const schema = JSON.parse(readFileSync(join(toolRoot, 'node_modules/oxlint/configuration_schema.json'), 'utf8'));
const nativeRules = new Set(Object.keys(schema.definitions.DummyRuleMap.properties));
const oxlint = join(toolRoot, 'node_modules/oxlint/bin/oxlint');
const tsc = join(toolRoot, 'node_modules/typescript/bin/tsc');
const tsconfigPath = join(root, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
// TS7 removes baseUrl; preserve the alias on the same isolated snapshot for both engines.
delete tsconfig.compilerOptions.baseUrl;
delete tsconfig.compilerOptions.ignoreDeprecations;
tsconfig.compilerOptions.paths = { '@one/*': ['./packages/one/src/*.ts'], '@built/*': ['./packages/one/.candidate-build/src/*.d.ts'] };
tsconfig.compilerOptions.outDir = './.candidate-build';
tsconfig.compilerOptions.jsx = 'preserve';
writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
writeFileSync(join(root, 'src/jsx-types.d.ts'), 'declare namespace JSX { interface Element {} interface IntrinsicElements { div: { title?: string }; } }\n');
writeFileSync(join(root, 'src/export-one.js'), 'export const clash = 1;\n');
writeFileSync(join(root, 'src/export-two.js'), 'export const clash = 2;\n');
writeFileSync(join(root, 'packages/one/src/async-value.ts'), 'export async function load(): Promise<number> {\n  return await Promise.resolve(1);\n}\n');
for (const name of ['one', 'two']) {
  const path = join(root, 'packages', name, 'tsconfig.json');
  const config = JSON.parse(readFileSync(path, 'utf8'));
  config.compilerOptions.outDir = './.candidate-build';
  writeFileSync(path, JSON.stringify(config, null, 2));
}
const policy = createConfig({ projectRoot: root, syntaxOnlyFiles: ['tools/**/*.ts', 'tools/**/*.cts'] });
const baseline = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: policy });
const cleanCompiler = spawnSync(process.execPath, [tsc, '--build', '--pretty', 'false'], { cwd: root, encoding: 'utf8', timeout: 30000 });
const nativeAliases = new Set(['no-empty-function', 'no-redeclare', 'no-shadow', 'no-unused-expressions', 'no-unused-vars', 'no-use-before-define']);
const gapRules = new Map();
const mappings = new Map();

function mapRule(id, setting) {
  if (id === 'no-inner-declarations') {
    // Oxlint's omitted option differs from ESLint's implicit allow in strict code.
    setting = ['error', 'functions', { blockScopedFunctions: 'allow' }];
  }
  let candidate;
  let owner = 'native';
  if (id === '@typescript-eslint/naming-convention') {
    candidate = 'eslint/id-match';
    setting = ['error', namingPattern, { onlyDeclarations: true, properties: false, ignoreDestructuring: true }];
    owner = 'simplified naming';
  }
  else if (id.startsWith('@stylistic/')) {
    candidate = id.replace('@stylistic/', 'style/');
    owner = 'Stylistic bridge';
  }
  else if (id === '@eslint-community/eslint-comments/require-description') {
    mappings.set(id, { original: id, candidate: 'preflight/require-description', owner: 'required descriptions through independent rule preflight' });
    return null;
  }
  else if (id === 'n/process-exit-as-throw') {
    mappings.set(id, { original: id, candidate: null, owner: 'inactive baseline setting' });
    return null;
  }
  else if (id === 'import-x/export') {
    candidate = 'policy/export';
    gapRules.set('export', id);
    owner = 'selected JavaScript rule bridge with child parser';
  }
  else {
    const translated = id.replace('@typescript-eslint/', 'typescript/').replace('import-x/', 'import/').replace(/^n\//u, 'node/');
    const name = id.split('/').at(-1);
    if (nativeRules.has(translated)) {
      candidate = translated.includes('/') ? translated : `eslint/${translated}`;
    }
    else if (id.startsWith('@typescript-eslint/') && nativeAliases.has(name)) {
      candidate = `eslint/${name}`;
    }
    else {
      candidate = `policy/${name}`;
      owner = 'selected JavaScript rule bridge';
      gapRules.set(name, id);
    }
    if (candidate === 'import/no-duplicates' && Array.isArray(setting) && setting[1]) {
      const { 'prefer-inline': preferInline, ...options } = setting[1];
      setting = [setting[0], { ...options, preferInline }];
    }
  }
  mappings.set(id, { original: id, candidate, owner });
  return [candidate, setting];
}

function mapRules(rules = {}) {
  return Object.fromEntries(Object.entries(rules).map(([id, setting]) => mapRule(id, setting)).filter(Boolean));
}

const candidate = {
  categories: { correctness: 'off' },
  plugins: ['typescript', 'import', 'node', 'unicorn'],
  jsPlugins: [
    { name: 'style', specifier: './style.mjs' },
    { name: 'policy', specifier: './policy.mjs' },
  ],
  env: { builtin: true },
  globals: policy[1].languageOptions.globals,
  settings: { n: { version: '>=24.0.0' } },
  options: { typeAware: true, reportUnusedDisableDirectives: 'error' },
  rules: mapRules(policy[1].rules),
  ignorePatterns: policy[0].ignores,
  overrides: policy.slice(2).filter((config) => config.files).map((config) => ({
    files: config.files,
    ...(config.ignores ? { excludeFiles: config.ignores } : {}),
    ...(config.languageOptions?.globals ? { globals: config.languageOptions.globals } : {}),
    rules: mapRules(config.rules),
  })),
};
candidate.overrides.push({
  files: ['**/*.d.{ts,mts,cts}', 'tools/**/*.{ts,cts}'],
  rules: Object.fromEntries(Object.entries(typedRules).filter(([id]) => id.startsWith('@typescript-eslint/')).map(([id]) => [id.replace('@typescript-eslint/', 'typescript/'), 'off'])),
});
candidate.rules['policy/inferred-coverage'] = 'warn';
candidate.overrides.at(-1).rules['policy/inferred-coverage'] = 'off';
writeFileSync(join(root, 'style.mjs'), `export { default } from ${JSON.stringify(pathToFileURL(join(toolRoot, 'node_modules/@stylistic/eslint-plugin/dist/index.js')).href)};\n`);
const selectedRules = [...gapRules].map(([name, id]) => {
  const owner = Object.keys(plugins).find((prefix) => id.startsWith(`${prefix}/`));
  return [name, owner ? [owner, id.slice(owner.length + 1)] : ['builtin', id]];
});
// These explicit bridge candidates retain gap checks; this is not an ESLint engine fallback.
writeFileSync(join(root, 'policy.mjs'), `
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { createExportParser } from ${JSON.stringify(pathToFileURL(join(repository, 'docs/research/oxlint-candidate/export-parser.mjs')).href)};
import { createExportGraphRule } from ${JSON.stringify(pathToFileURL(join(repository, 'docs/research/oxlint-candidate/export-graph.mjs')).href)};
const require = createRequire(${JSON.stringify(pathToFileURL(join(toolRoot, 'package.json')).href)});
const { parseSync, visitorKeys } = await import(require.resolve('oxc-parser'));
const exportParser = createExportParser(parseSync, visitorKeys);
const { ExportMap } = await import(require.resolve('eslint-plugin-import-x/utils'));
const { builtinRules } = await import(require.resolve('eslint/use-at-your-own-risk'));
const { createTypeScriptImportResolver } = await import(require.resolve('eslint-import-resolver-typescript'));
const plugins = Object.fromEntries(await Promise.all(${JSON.stringify(['import-x', 'n', 'unicorn'])}.map(async (name) => {
  const specifier = { 'import-x': 'eslint-plugin-import-x', n: 'eslint-plugin-n', unicorn: 'eslint-plugin-unicorn' }[name];
  return [name, (await import(require.resolve(specifier))).default];
})));
const settings = { n: { version: '>=24.0.0' }, 'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'], 'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true, project: ${JSON.stringify([tsconfigPath, join(root, 'packages/one/tsconfig.json'), join(root, 'packages/two/tsconfig.json')])} })] };
const selected = ${JSON.stringify(selectedRules)};
const coverage = new Set(${JSON.stringify([tsconfigPath, join(root, 'packages/one/tsconfig.json'), join(root, 'packages/two/tsconfig.json')])}.flatMap((project) => {
  const output = spawnSync(process.execPath, [${JSON.stringify(tsc)}, '--showConfig', '--project', project], { encoding: 'utf8', timeout: 30000 });
  if (output.status !== 0) { throw new Error('Cannot inspect configured coverage: ' + output.stdout + output.stderr); }
  return JSON.parse(output.stdout).files.map((file) => resolve(dirname(project), file));
}));
const rules = Object.fromEntries(selected.map(([name, [owner, id]]) => {
  const rule = name === 'export' ? createExportGraphRule(ExportMap, exportParser, plugins['import-x'].rules.export) : owner === 'builtin' ? builtinRules.get(id) : plugins[owner].rules[id];
  return [name, { ...rule, create(context) {
    return rule.create(Object.create(context, {
      settings: { value: { ...context.settings, ...settings }, enumerable: true },
      ...(name === 'export' ? { languageOptions: { value: { ...context.languageOptions, parser: exportParser }, enumerable: true } } : {}),
    }));
  } }];
}));
rules['inferred-coverage'] = { meta: { schema: [] }, create(context) { return { Program(node) {
  if (/\\.(?:ts|tsx|mts|cts)$/.test(context.filename) && !coverage.has(context.filename)) {
    context.report({ node, message: 'TypeScript is outside configured projects; continuing with inferred coverage and potentially different compiler settings.' });
  }
} }; } };
export default { meta: { name: 'policy' }, rules };
`);
const candidatePath = join(root, '.oxlintrc.json');
writeFileSync(candidatePath, JSON.stringify(candidate, null, 2));
const emptyConfig = { categories: { correctness: 'off' }, plugins: [] };
const results = {
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  versions: Object.fromEntries(['oxlint', 'oxlint-tsgolint', 'typescript'].map((name) => [name, JSON.parse(readFileSync(join(toolRoot, 'node_modules', name, 'package.json'), 'utf8')).version])),
  compilerAdjustment: 'Removed baseUrl/ignoreDeprecations; changed paths to ./packages/one/src/*.ts for NodeNext; isolated compiler outDir. Same snapshot used by both engines.',
  cleanCompiler: { status: cleanCompiler.status, stdout: cleanCompiler.stdout, stderr: cleanCompiler.stderr },
  style: [], naming: [], typed: [], behavior: [], profiles: [], timings: [],
  typedControls: [], fixes: [],
  referenceBuild: [],
  exports: [],
  processExitAsThrowSupported: plugins.n.rules['process-exit-as-throw'].meta.supported,
};

function run(config, files, extra = []) {
  const configPath = typeof config === 'string' ? config : join(root, 'probe.json');
  if (typeof config !== 'string') {
    writeFileSync(configPath, JSON.stringify(config));
  }
  const started = performance.now();
  const processResult = spawnSync(process.execPath, [oxlint, '-c', configPath, '--format', 'json', '--threads', '1', ...extra, ...files], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  let output;
  try {
    output = JSON.parse(processResult.stdout);
  }
  catch {
    output = { diagnostics: [], raw: processResult.stdout };
  }
  const fullPolicy = config === candidatePath || (typeof config === 'object' && config.rules?.['policy/inferred-coverage']);
  if (fullPolicy) {
    for (const file of files) {
      try {
        output.diagnostics.push(...checkDescriptions(descriptionParser, descriptionRule, file, readFileSync(join(root, file), 'utf8')));
      }
      catch (error) {
        output.diagnostics.push({ code: 'preflight(parse)', severity: 'error', filename: file, message: error.message });
      }
    }
  }
  const status = processResult.status === 0 && output.diagnostics.some((item) => item.severity === 'error') ? 1 : processResult.status;
  return { status, elapsedMs: performance.now() - started, ...output, stderr: processResult.stderr, error: processResult.error?.message };
}

function codes(result) {
  return result.diagnostics.map((diagnostic) => diagnostic.code?.replace(/^([^()]+)\((.+)\)$/u, '$1/$2') ?? diagnostic.message);
}

function saveInput(file, code) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), code);
}

function normalize(result) {
  return JSON.parse(JSON.stringify(result).replaceAll(root, '<project>').replaceAll(pathToFileURL(repository).href.replace(/\/$/u, ''), '<repository-url>').replaceAll(repository.replace(/\/$/u, ''), '<repository>').replaceAll(toolRoot, '<tools>'));
}

async function isolatedBaseline(file, code, rules, typed = false, fix = false) {
  const engine = new ESLint({ cwd: root, overrideConfigFile: true, fix, overrideConfig: [{
    files: ['**/*.{js,jsx,ts,tsx,cjs,cts}'], plugins,
    languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: file.endsWith('.cjs') ? 'commonjs' : 'module', parserOptions: { ecmaFeatures: { jsx: true }, ...(typed ? { projectService: true, tsconfigRootDir: root } : {}) } },
    rules,
  }] });
  return (await engine.lintText(code, { filePath: join(root, file) }))[0];
}

console.log('Comparing 66 style rules and repeated fixes.');
for (const [name, value] of Object.entries(styleCases)) {
  const [code, extension] = Array.isArray(value) ? value : [value, 'js'];
  const file = `style/${name}.${extension}`;
  const id = `@stylistic/${name}`;
  saveInput(file, code);
  const config = { ...emptyConfig, jsPlugins: [{ name: 'style', specifier: './style.mjs' }], rules: { [`style/${name}`]: styleRules[id] } };
  const old = await isolatedBaseline(file, code, { [id]: styleRules[id] });
  const oldFixed = await isolatedBaseline(file, code, { [id]: styleRules[id] }, false, true);
  const initial = run(config, [file]);
  let previous = code;
  let passes = 0;
  let firstFixed;
  let fixedResult;
  let stable = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    fixedResult = run(config, [file], ['--fix']);
    const output = readFileSync(join(root, file), 'utf8');
    firstFixed ??= output;
    passes++;
    if (output === previous) {
      stable = true;
      break;
    }
    previous = output;
  }
  results.style.push({ name, baselineReported: old.messages.some((message) => message.ruleId === id), candidateReported: codes(initial).includes(`style/${name}`), baselineMessages: old.messages, initial, passes, stable, firstFixMatches: firstFixed === (oldFixed.output ?? code), finalFixMatches: previous === (oldFixed.output ?? code), baselineRemaining: oldFixed.messages, final: fixedResult });
}
console.log('Comparing declaration-focused naming scopes.');
for (const [name, code] of Object.entries(namingCases)) {
  const file = 'src/naming.ts';
  saveInput(file, code);
  const setting = ['error', namingPattern, { onlyDeclarations: true, properties: false, ignoreDestructuring: true }];
  const old = await isolatedBaseline(file, code, { 'id-match': setting });
  const current = run({ ...emptyConfig, rules: { 'eslint/id-match': setting } }, [file]);
  results.naming.push({ name, baseline: old.messages, candidate: current });
}
console.log('Checking all 48 configured typed rules through tsgolint.');
for (const [name, code] of Object.entries(typedCases)) {
  saveInput(`src/typed-${name}.ts`, `${code}export {};\n`);
}
for (const [name, code] of typedControls) {
  saveInput(`src/control-${name}.ts`, `${code}export {};\n`);
}
const typedConfig = { ...emptyConfig, plugins: ['typescript'], options: { typeAware: true }, rules: Object.fromEntries(Object.entries(typedRules).filter(([id]) => id.startsWith('@typescript-eslint/')).map(([id, setting]) => [id.replace('@typescript-eslint/', 'typescript/'), setting])) };
const typedRun = run(typedConfig, Object.keys(typedCases).map((name) => `src/typed-${name}.ts`));
results.typedRun = typedRun;
for (const [name, code] of Object.entries(typedCases)) {
  const file = `src/typed-${name}.ts`;
  const old = await isolatedBaseline(file, `${code}export {};\n`, { [`@typescript-eslint/${name}`]: typedRules[`@typescript-eslint/${name}`] }, true);
  const findings = typedRun.diagnostics.filter((diagnostic) => diagnostic.filename === file);
  results.typed.push({ name, baselineReported: old.messages.some((message) => message.ruleId === `@typescript-eslint/${name}`), candidateReported: codes({ diagnostics: findings }).includes(`typescript/${name}`), baseline: old.messages, candidate: findings });
}
for (const [name, code, required, forbidden] of typedControls) {
  const file = `src/control-${name}.ts`;
  const old = await isolatedBaseline(file, `${code}export {};\n`, Object.fromEntries(Object.entries(typedRules).filter(([id]) => id.startsWith('@typescript-eslint/'))), true);
  const current = run(typedConfig, [file]);
  const currentCodes = codes(current);
  const oldCodes = new Set(old.messages.map((message) => message.ruleId?.replace('@typescript-eslint/', 'typescript/')));
  results.typedControls.push({ name, required, forbidden, baseline: old.messages, candidate: current, baselinePass: required.every((id) => oldCodes.has(`typescript/${id}`)) && forbidden.every((id) => !oldCodes.has(`typescript/${id}`)), candidatePass: required.every((id) => currentCodes.includes(`typescript/${id}`)) && forbidden.every((id) => !currentCodes.includes(`typescript/${id}`)) });
}
console.log('Running combined candidate profiles and integration fixtures.');
saveInput('src/native-export-gap.js', "export * from './export-one.js';\nexport * from './export-two.js';\n");
results.nativeExportGap = run({ ...emptyConfig, plugins: ['import'], rules: { 'import/export': 'error' } }, ['src/native-export-gap.js']);
for (const [name, files, entry, expectedCount] of exportCases) {
  for (const [file, code] of Object.entries(files)) {
    saveInput(`src/export-graphs/${name}/${file}`, code);
  }
  const file = `src/export-graphs/${name}/${entry}`;
  const code = files[entry];
  let old;
  let baselineError;
  try {
    old = (await baseline.lintText(code, { filePath: join(root, file) }))[0];
  }
  catch (error) {
    baselineError = error.message;
  }
  const current = run({ ...emptyConfig, jsPlugins: [{ name: 'policy', specifier: './policy.mjs' }], rules: { 'policy/export': 'error' } }, [file]);
  const original = old?.messages.filter((message) => message.ruleId === 'import-x/export') ?? [];
  results.exports.push({ name, expectedCount, baseline: original, baselineError, candidate: current, parity: !baselineError && original.length === current.diagnostics.length && !current.diagnostics.some((item) => item.message.startsWith('Error running JS plugin.')), pass: current.diagnostics.length === expectedCount && current.status === (expectedCount ? 1 : 0) && !current.diagnostics.some((item) => item.message.startsWith('Error running JS plugin.')) });
}
for (const [name, file, code, expected] of behaviorCases) {
  saveInput(file, code);
  const old = (await baseline.lintText(code.replaceAll('oxlint-disable', 'eslint-disable'), { filePath: join(root, file) }))[0];
  const current = run(candidatePath, [file]);
  results.behavior.push({ name, file, expected, observed: codes(current), baseline: old.messages, candidate: current });
}
const referenceFile = 'src/reference-consumer.ts';
saveInput(referenceFile, "import { load } from '@built/async-value';\n\nload();\n");
const declarationOutput = join(root, 'packages/one/.candidate-build/src/async-value.d.ts');
results.referenceBuild.push({ state: 'built', candidate: run(candidatePath, [referenceFile]) });
renameSync(declarationOutput, `${declarationOutput}.saved`);
try {
  results.referenceBuild.push({ state: 'missing', candidate: run(candidatePath, [referenceFile]) });
}
finally {
  renameSync(`${declarationOutput}.saved`, declarationOutput);
}
results.referenceBuild.push({ state: 'restored', candidate: run(candidatePath, [referenceFile]) });
saveInput('src/source.js', 'debugger;\n');
results.consumerOverride = { baseline: run(candidatePath, ['src/source.js']), override: run({ ...candidate, overrides: [...candidate.overrides, { files: ['src/source.js'], rules: { 'eslint/no-debugger': 'off' } }] }, ['src/source.js']) };
const fixingBaseline = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: policy, fix: true });
for (const [name, file, code] of fixCases) {
  saveInput(file, code);
  const old = (await fixingBaseline.lintText(code, { filePath: join(root, file) }))[0];
  let previous = code;
  const passes = [];
  let stable = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = run(candidatePath, [file], ['--fix']);
    const output = readFileSync(join(root, file), 'utf8');
    passes.push({ output, result: current });
    if (output === previous) {
      stable = true;
      break;
    }
    previous = output;
  }
  results.fixes.push({ name, baselineOutput: old.output ?? code, baselineRemaining: old.messages, stable, finalFixMatches: previous === (old.output ?? code), passes });
}
for (const name of readdirSync(join(repository, 'examples/rules')).filter((file) => file.endsWith('.mjs'))) {
  const contents = readFileSync(join(repository, 'examples/rules', name), 'utf8');
  const file = /Representative file: (.+)\./u.exec(contents)[1];
  const code = file.includes('.d.') ? 'export type Value = string;\n' : /\.(?:cjs|cts)$/u.test(file) ? 'console.log(1);\n' : 'export const value = 1;\n';
  saveInput(file, code);
  results.profiles.push({ name: name.replace('.mjs', ''), file, candidate: run(candidatePath, [file]) });
}
const compiler = spawnSync(process.execPath, [tsc, '--build', '--pretty', 'false'], { cwd: root, encoding: 'utf8', timeout: 30000 });
results.compiler = { status: compiler.status, stdout: compiler.stdout, stderr: compiler.stderr };
// Use only neutral reference inputs for both timings; intentional failures stay outside this set.
const timingFiles = results.profiles.map(({ file }) => file);
results.timingSnapshot = timingFiles;
const baselinePath = join(root, 'baseline.mjs');
writeFileSync(baselinePath, `import { createConfig } from ${JSON.stringify(pathToFileURL(join(repository, 'src/index.js')).href)};\nexport default createConfig({ projectRoot: ${JSON.stringify(root)}, syntaxOnlyFiles: ['tools/**/*.ts', 'tools/**/*.cts'] });\n`);
for (let iteration = 0; iteration < 4; iteration++) {
  const start = performance.now();
  const old = spawnSync(process.execPath, [join(repository, 'node_modules/eslint/bin/eslint.js'), '--no-config-lookup', '--config', baselinePath, '--format', 'json', ...timingFiles], { cwd: root, encoding: 'utf8', timeout: 30000 });
  results.timings.push({ engine: 'ESLint CLI', iteration, elapsedMs: performance.now() - start, warmup: iteration === 0, status: old.status, stderr: old.stderr });
  const current = run(candidatePath, timingFiles);
  results.timings.push({ engine: 'Oxlint CLI', iteration, elapsedMs: current.elapsedMs, warmup: iteration === 0, status: current.status });
}
results.mapping = [...mappings.values()].sort((left, right) => left.original.localeCompare(right.original));
results.candidate = candidate;
results.completeCandidateToolchain = JSON.parse(readFileSync(join(toolRoot, 'package.json'), 'utf8')).dependencies;
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify(normalize(results), null, 2)}\n`);
console.log(`Recorded paired evidence in ${relative(repository, destination)}; isolated fixture project retained at ${root}`);
