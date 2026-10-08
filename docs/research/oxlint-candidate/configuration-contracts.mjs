/* eslint-disable complexity, no-await-in-loop -- Bounded sequential configuration research; not the public package or permanent suite. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const tools = realpathSync(resolve(process.argv[2] ?? '/private/tmp/bramsey-oxlint-candidate-tools'));
const require = createRequire(join(tools, 'package.json'));
const { globSync } = await import(require.resolve('tinyglobby'));
const { createTypeScriptImportResolver } = await import(require.resolve('eslint-import-resolver-typescript'));
const { parseSync } = await import(require.resolve('oxc-parser'));
const globals = (await import(require.resolve('globals'))).default;
const root = realpathSync(mkdtempSync(join(tmpdir(), 'bramsey-configuration-contract-')));
symlinkSync(join(tools, 'node_modules'), join(root, 'node_modules'), 'dir');
const tsc = join(tools, 'node_modules/typescript/bin/tsc');
const oxlint = join(tools, 'node_modules/oxlint/bin/oxlint');
const destination = resolve(process.argv[3] ?? fileURLToPath(new URL('./configuration-results.json', import.meta.url)));
const checks = [];
const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**'];

function save(file, content) {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  return path;
}

function canonical(path) {
  if (!isAbsolute(path)) {
    throw new TypeError('projectRoot must be absolute');
  }
  return realpathSync(path);
}

function contains(directory, file) {
  const path = relative(directory, file);
  return path !== '..' && !path.startsWith('../') && !isAbsolute(path);
}

// Use the selected compiler's config expansion: TS7 has no legacy parseJsonConfigFileContent API.
// This snapshot is deliberately rebuilt on each invocation, including inherited config changes.
function discoverCoverage(projectRoot) {
  const projects = new Map();
  const metadata = new Map();
  const programInputs = new Set();
  function visit(path) {
    const configFile = canonical(path);
    if (projects.has(configFile)) {
      return;
    }
    const validation = spawnSync(process.execPath, [tsc, '--build', '--dry', configFile], { cwd: projectRoot, encoding: 'utf8', timeout: 30000 });
    if (validation.status !== 0) {
      throw new Error(`Cannot inspect configured coverage: ${validation.stdout}${validation.stderr}`);
    }
    const result = spawnSync(process.execPath, [tsc, '--showConfig', '--project', configFile], { cwd: projectRoot, encoding: 'utf8', timeout: 30000 });
    if (result.status !== 0) {
      throw new Error(`Cannot inspect configured coverage: ${result.stdout}${result.stderr}`);
    }
    const config = JSON.parse(result.stdout);
    const inputs = spawnSync(process.execPath, [tsc, '--listFilesOnly', '--project', configFile], { cwd: projectRoot, encoding: 'utf8', timeout: 30000 });
    if (inputs.status !== 0) {
      throw new Error(`Cannot inspect configured coverage: ${inputs.stdout}${inputs.stderr}`);
    }
    // Include transitive imports, which --showConfig's root-file list omits.
    const files = inputs.stdout.trim().split(/\r?\n/u).filter(Boolean).map((file) => canonical(file));
    for (const file of files) {
      programInputs.add(file);
    }
    const rootFiles = (config.files ?? []).map((file) => canonical(resolve(dirname(configFile), file)));
    projects.set(configFile, rootFiles);
    const references = (config.references ?? []).map(({ path: referencePath }) => {
      const target = resolve(dirname(configFile), referencePath);
      return canonical(target.endsWith('.json') ? target : join(target, 'tsconfig.json'));
    });
    metadata.set(configFile, { references, disableSolutionSearching: config.compilerOptions?.disableSolutionSearching === true });
    for (const reference of config.references ?? []) {
      const target = resolve(dirname(configFile), reference.path);
      visit(target.endsWith('.json') ? target : join(target, 'tsconfig.json'));
    }
  }
  for (const path of globSync('**/tsconfig.json', { cwd: projectRoot, absolute: true, ignore })) {
    visit(path);
  }
  function configuredProject(file) {
    const candidates = [...projects.keys()].filter((path) => path.endsWith('/tsconfig.json') && contains(dirname(path), canonical(file)))
      .sort((left, right) => right.length - left.length);
    for (const candidate of candidates) {
      const queue = [candidate];
      const visited = new Set();
      while (queue.length > 0) {
        const configFile = queue.shift();
        if (visited.has(configFile)) {
          continue;
        }
        visited.add(configFile);
        if (projects.get(configFile).includes(canonical(file))) {
          return configFile;
        }
        queue.push(...metadata.get(configFile).references);
      }
      // No membership fallback was found. The pinned engine continues to ancestors
      // even when disableSolutionSearching is true in this no-fallback branch.
    }
    return undefined;
  }
  return { projects: [...projects.keys()], files: new Set([...projects.values()].flat().filter((file) => configuredProject(file))), programInputs, configuredProject };
}

function nearestResolver(projectRoot, { project = '**/tsconfig.json', ...settings } = {}) {
  const projects = globSync(project, { cwd: projectRoot, absolute: true, ignore }).map((path) => canonical(path));
  if (projects.length === 0) {
    throw new Error('No resolver projects match the configured project patterns');
  }
  const resolvers = [...new Set(projects)].map((path) => ({
    directory: dirname(path),
    resolver: createTypeScriptImportResolver({ alwaysTryTypes: true, ...settings, project: path }),
  }));
  const fallback = createTypeScriptImportResolver({ alwaysTryTypes: true, ...settings, project: [] });
  return { interfaceVersion: 3, name: 'candidate-nearest-project', resolve(source, file) {
    const selected = resolvers.filter(({ directory }) => contains(directory, canonical(file)))
      .sort((left, right) => right.directory.length - left.directory.length)[0];
    return (selected?.resolver ?? fallback).resolve(source, canonical(file));
  } };
}

function modeConfigs(projectRoot, commonjsFiles = [], moduleFiles = []) {
  const moduleGlobals = { ...globals.nodeBuiltin, require: 'off', module: 'off', exports: 'off', __dirname: 'off', __filename: 'off' };
  const packages = globSync(['package.json', '**/package.json'], { cwd: projectRoot, absolute: true, ignore })
    .sort((left, right) => left.split('/').length - right.split('/').length || left.localeCompare(right));
  const stages = packages.map((manifest) => {
    const prefix = relative(projectRoot, dirname(manifest)).replaceAll('\\', '/');
    return { files: [`${prefix ? `${prefix}/` : ''}**/*.{js,jsx,ts,tsx}`], mode: JSON.parse(readFileSync(manifest, 'utf8')).type === 'module' ? 'module' : 'commonjs' };
  });
  stages.push({ files: commonjsFiles, mode: 'commonjs' }, { files: moduleFiles, mode: 'module' },
    { files: ['**/*.{cjs,cts}'], mode: 'commonjs' }, { files: ['**/*.{mjs,mts}'], mode: 'module' });
  return {
    mode(file) {
      let mode = 'module';
      for (const stage of stages) {
        if (globSync(stage.files, { cwd: projectRoot, absolute: true, ignore }).some((path) => canonical(path) === canonical(file))) {
          mode = stage.mode;
        }
      }
      return mode;
    },
    overrides: stages.filter(({ files }) => files.length > 0).map(({ files, mode }) => ({ files, globals: mode === 'commonjs' ? globals.node : moduleGlobals })),
    moduleGlobals,
  };
}

function run(config, files, extra = [], cwd = root) {
  const configPath = save('contract.json', config);
  const result = spawnSync(process.execPath, [oxlint, '--config', canonical(configPath), '--format', 'json', '--threads', '1', ...extra, ...files], { cwd: canonical(cwd), encoding: 'utf8', timeout: 30000 });
  let output;
  try {
    output = JSON.parse(result.stdout);
  }
  catch {
    output = { raw: result.stdout, diagnostics: [] };
  }
  return { status: result.status, ...output, stderr: result.stderr, error: result.error?.message };
}

function record(name, actual, pass) {
  checks.push({ name, actual, pass });
}

const compilerOptions = { strict: true, noUncheckedIndexedAccess: true, target: 'ES2024', module: 'NodeNext', composite: true };
save('package.json', { type: 'module' });
save('tsconfig.base.json', { compilerOptions });
save('tsconfig.json', { extends: './tsconfig.base.json', include: ['src/**/*.ts'], exclude: ['src/excluded.ts'], references: [{ path: './packages/a' }, { path: './packages/b/tsconfig.app.json' }] });
save('src/clean.ts', 'export const value = 1;\n');
save('src/excluded.ts', 'void Promise.resolve(1);\n');
save('tools/syntax.ts', 'void Promise.resolve(1);\n');
save('packages/a/package.json', { type: 'module' });
save('packages/a/tsconfig.json', { compilerOptions: { ...compilerOptions, paths: { '@value': ['./src/local.ts'] } }, files: ['src/local.ts', 'src/consumer.ts'] });
save('packages/a/src/local.ts', 'export const value = 1;\n');
save('packages/a/src/consumer.ts', "import { value } from '@value';\nconsole.log(value);\n");
save('packages/a/src/excluded.ts', 'void Promise.resolve(1);\n');
save('packages/b/package.json', {});
save('packages/b/tsconfig.app.json', { compilerOptions: { ...compilerOptions, paths: { '@value': ['./src/local.ts'] } }, include: ['src/**/*.ts'] });
save('packages/b/src/local.ts', 'export const value = 2;\n');
save('packages/b/src/consumer.ts', "import { value } from '@value';\nconsole.log(value);\n");
// A second root is essential: a process-global resolver cache must not cross projects.
save('other/tsconfig.json', { compilerOptions: { ...compilerOptions, paths: { '@value': ['./local.ts'] } }, files: ['local.ts', 'consumer.ts'] });
save('other/local.ts', 'export const value = 3;\n');
save('other/consumer.ts', "import { value } from '@value';\nconsole.log(value);\n");

const coverage = discoverCoverage(root);
record('inherited include/exclude and explicit files', [...coverage.files], coverage.files.has(join(root, 'src/clean.ts')) && !coverage.files.has(join(root, 'src/excluded.ts')) && !coverage.files.has(join(root, 'packages/a/src/excluded.ts')));
record('nonstandard referenced project discovery', coverage.projects, coverage.files.has(join(root, 'packages/b/src/consumer.ts')));
save('src/new.ts', 'export const value = 1;\n');
record('membership refresh after source addition', [...discoverCoverage(root).files], discoverCoverage(root).files.has(join(root, 'src/new.ts')) && !coverage.files.has(join(root, 'src/new.ts')));
save('tsconfig.base.json', { compilerOptions, exclude: ['src/new.ts', 'src/excluded.ts'] });
save('tsconfig.json', { extends: './tsconfig.base.json', include: ['src/**/*.ts'], references: [{ path: './packages/a' }, { path: './packages/b/tsconfig.app.json' }] });
record('inherited configuration refresh', [...discoverCoverage(root).files], !discoverCoverage(root).files.has(join(root, 'src/new.ts')));
save('src/clean.ts', "import './excluded.js';\nexport const value = 1;\n");
const importedCoverage = discoverCoverage(root);
record('program inclusion does not imply configured tsgolint selection', { programIncludes: importedCoverage.programInputs.has(join(root, 'src/excluded.ts')), selected: importedCoverage.configuredProject(join(root, 'src/excluded.ts')) }, importedCoverage.programInputs.has(join(root, 'src/excluded.ts')) && !importedCoverage.configuredProject(join(root, 'src/excluded.ts')));
save('src/clean.ts', 'export const value = 1;\n');
save('broken/tsconfig.json', '{ broken');
let malformed;
try {
  discoverCoverage(root);
}
catch (error) {
  malformed = error.message;
}
record('malformed config fails setup rather than inferred warning', malformed, malformed?.includes('Cannot inspect configured coverage') === true);
save('broken/tsconfig.json', { files: [], references: [{ path: '../packages/a' }] });
record('solution config with files empty follows references', discoverCoverage(root).projects, discoverCoverage(root).files.has(join(root, 'packages/a/src/local.ts')));
save('selection/tsconfig.json', { compilerOptions: { ...compilerOptions, noUncheckedIndexedAccess: false, disableSolutionSearching: true }, files: ['inside.ts'] });
save('selection/inside.ts', 'export const value = 1;\n');
save('selection/out.ts', 'export function read(values: string[]): string | undefined { const value = values[0]; if (value === undefined) { return undefined; } return value; }\n');
save('tsconfig.json', { extends: './tsconfig.base.json', include: ['src/**/*.ts', 'selection/out.ts'], references: [{ path: './packages/a' }, { path: './packages/b/tsconfig.app.json' }] });
const ancestorCoverage = discoverCoverage(root);
const ancestorTyped = run({ categories: { correctness: 'off' }, plugins: ['typescript'], options: { typeAware: true }, rules: { 'typescript/no-unnecessary-condition': 'error' } }, ['selection/out.ts']);
record('ancestor membership after nearest miss with solution searching disabled', { selected: ancestorCoverage.configuredProject(join(root, 'selection/out.ts')), native: ancestorTyped }, ancestorCoverage.configuredProject(join(root, 'selection/out.ts')) === join(root, 'tsconfig.json') && ancestorTyped.status === 0 && ancestorTyped.diagnostics.length === 0);

const rootAlias = join(dirname(root), `${root.split('/').at(-1)}-link`);
symlinkSync(root, rootAlias, 'dir');
record('canonical root through symlink', canonical(rootAlias), canonical(rootAlias) === root);
let relativeError;
try {
  canonical('.');
}
catch (error) {
  relativeError = error.message;
}
record('relative root rejected', relativeError, relativeError?.includes('absolute') === true);

const resolver = nearestResolver(root, { project: ['tsconfig.json', 'packages/a/tsconfig.json', 'packages/b/tsconfig.app.json'] });
const resolvedA = resolver.resolve('@value', join(root, 'packages/a/src/consumer.ts'));
const resolvedB = resolver.resolve('@value', join(root, 'packages/b/src/consumer.ts'));
record('nearest workspace aliases do not collide', { resolvedA, resolvedB }, resolvedA.path === join(root, 'packages/a/src/local.ts') && resolvedB.path === join(root, 'packages/b/src/local.ts'));
const linked = resolver.resolve('@value', join(rootAlias, 'packages/b/src/consumer.ts'));
record('resolver canonicalizes symlink file input', linked, linked.path === resolvedB.path);
const independent = nearestResolver(join(root, 'other')).resolve('@value', join(root, 'other/consumer.ts'));
record('independent root does not reuse alias cache', independent, independent.path === join(root, 'other/local.ts'));
const customExtension = nearestResolver(root, { project: ['packages/a/tsconfig.json'], extensions: ['.custom'] });
save('packages/a/src/value.custom', 'export const value = 1;\n');
const custom = customExtension.resolve('./value', join(root, 'packages/a/src/consumer.ts'));
record('resolver customization beyond project filenames', custom, custom.path === join(root, 'packages/a/src/value.custom'));
record('resolver misses remain misses', resolver.resolve('@missing/value', join(root, 'packages/a/src/consumer.ts')), resolver.resolve('@missing/value', join(root, 'packages/a/src/consumer.ts')).found === false);

save('resolver.mjs', `import { realpathSync } from 'node:fs';\nimport { dirname, isAbsolute, relative } from 'node:path';\nimport { createRequire } from 'node:module';\nconst require = createRequire(${JSON.stringify(join(tools, 'package.json'))});\nconst { globSync } = await import(require.resolve('tinyglobby'));\nconst { createTypeScriptImportResolver } = await import(require.resolve('eslint-import-resolver-typescript'));\nconst plugin = (await import(require.resolve('eslint-plugin-import-x'))).default;\nconst ignore = ${JSON.stringify(ignore)};\n${canonical.toString()}\n${contains.toString()}\n${nearestResolver.toString()}\nconst resolver = nearestResolver(${JSON.stringify(root)}, { project: ['tsconfig.json', 'packages/a/tsconfig.json', 'packages/b/tsconfig.app.json'] });\nconst rule = plugin.rules['no-unresolved'];\nexport default { meta: { name: 'resolution' }, rules: { 'no-unresolved': { ...rule, create(context) { return rule.create(Object.create(context, { settings: { value: { ...context.settings, 'import-x/resolver-next': [resolver] } } })); } } } };\n`);
const resolutionConfig = { categories: { correctness: 'off' }, plugins: [], jsPlugins: [{ name: 'resolution', specifier: pathToFileURL(join(root, 'resolver.mjs')).href }], rules: { 'resolution/no-unresolved': 'error' } };
const bridgeAliases = run(resolutionConfig, ['packages/a/src/consumer.ts', 'packages/b/src/consumer.ts']);
record('nearest aliases through actual Oxlint bridge', bridgeAliases, bridgeAliases.status === 0 && bridgeAliases.diagnostics.length === 0);
save('packages/a/src/consumer.ts', "import { value } from '@missing/value';\nconsole.log(value);\n");
const bridgeMissing = run(resolutionConfig, ['packages/a/src/consumer.ts']);
record('bridge resolver preserves missing import failure', bridgeMissing, bridgeMissing.status === 1 && bridgeMissing.diagnostics.some(({ code }) => code === 'resolution(no-unresolved)'));
save('packages/a/src/consumer.ts', "import { value } from '@value';\nconsole.log(value);\n");

// A root-only flag cannot provide per-file exemptions. Use the exact explicit typed-rule list.
const typed = JSON.parse(readFileSync(new URL('./results.json', import.meta.url), 'utf8')).candidate.overrides.at(-1).rules;
const typedOff = Object.fromEntries(Object.entries(typed).filter(([id]) => id.startsWith('typescript/')));
const liveCoverage = discoverCoverage(root);
save('coverage.mjs', `import { realpathSync } from 'node:fs';\nconst files = new Set(${JSON.stringify([...liveCoverage.files])});\nexport default { meta: { name: 'coverage' }, rules: { inferred: { meta: { schema: [] }, create(context) { return { Program(node) { if (/\\.(?:ts|tsx|mts|cts)$/.test(context.filename) && !files.has(realpathSync(context.filename))) context.report({node, message: 'TypeScript is outside configured projects; continuing with inferred coverage.'}); } }; } } } };\n`);
const modes = modeConfigs(root, ['forced/commonjs.*'], ['forced/module.*']);
const native = { categories: { correctness: 'off' }, plugins: ['typescript'], jsPlugins: [{ name: 'coverage', specifier: pathToFileURL(join(root, 'coverage.mjs')).href }], options: { typeAware: true, reportUnusedDisableDirectives: 'error' }, rules: { 'typescript/no-floating-promises': ['error', { ignoreVoid: false }], 'typescript/no-unsafe-member-access': 'error', 'coverage/inferred': 'warn' }, overrides: [{ files: ['tools/**/*.ts', '**/*.d.{ts,mts,cts}'], rules: { ...typedOff, 'coverage/inferred': 'off' } }] };
const outside = run(native, ['src/excluded.ts']);
record('excluded promise warns and retains typed failure', outside, outside.status === 1 && outside.diagnostics.some(({ code }) => code === 'coverage(inferred)') && outside.diagnostics.some(({ code }) => code === 'typescript(no-floating-promises)'));
save('src/excluded.ts', 'export const value = 1;\n');
const warning = run(native, ['src/excluded.ts']);
record('warning alone exits zero', warning, warning.status === 0 && warning.diagnostics.length === 1 && warning.diagnostics[0].severity === 'warning');
const denyWarning = run(native, ['src/excluded.ts'], ['--deny-warnings']);
record('consumer warning-failure request respected', denyWarning, denyWarning.status === 1);
save('src/excluded.ts', 'declare const value: any;\nvalue.member;\n');
const unsafe = run(native, ['src/excluded.ts']);
record('excluded unsafe access retains typed failure', unsafe, unsafe.status === 1 && unsafe.diagnostics.some(({ code }) => code === 'typescript(no-unsafe-member-access)'));
const syntax = run(native, ['tools/syntax.ts']);
record('syntax-only disables all enabled typed rules and warning', syntax, syntax.status === 0 && syntax.diagnostics.length === 0 && Object.keys(typedOff).length === 48);
const linkedSyntax = run(native, [canonical(join(rootAlias, 'tools/syntax.ts'))], [], rootAlias);
record('canonical runner prevents symlink exemption leak', linkedSyntax, linkedSyntax.status === 0 && linkedSyntax.diagnostics.length === 0);
save('src/source.d.ts', 'export type Value = string;\n');
const declaration = run(native, ['src/source.d.ts']);
record('declarations skip inferred coverage and typed rules', declaration, declaration.status === 0 && declaration.diagnostics.length === 0);
save('packages/a/src/consumer.ts', 'void Promise.resolve(1);\n');
const workspace = run(native, ['packages/a/src/consumer.ts']);
record('workspace typed promise safety without coverage warning', workspace, workspace.status === 1 && workspace.diagnostics.some(({ code }) => code === 'typescript(no-floating-promises)') && !workspace.diagnostics.some(({ code }) => code === 'coverage(inferred)'));
save('packages/b/src/consumer.ts', 'void Promise.resolve(1);\n');
const referenced = run(native, ['packages/b/src/consumer.ts']);
record('nonstandard reference typed safety without coverage warning', referenced, referenced.status === 1 && referenced.diagnostics.some(({ code }) => code === 'typescript(no-floating-promises)') && !referenced.diagnostics.some(({ code }) => code === 'coverage(inferred)'));

const empty = { categories: { correctness: 'off' }, plugins: [] };
save('src/debug.js', 'debugger;\n');
const override = run({ ...empty, rules: { 'eslint/no-debugger': 'error' }, overrides: [{ files: ['src/**'], rules: { 'eslint/no-debugger': 'error' } }, { files: ['src/debug.js'], rules: { 'eslint/no-debugger': 'off' } }] }, ['src/debug.js']);
record('last consumer override wins', override, override.status === 0 && override.diagnostics.length === 0);
const invalid = run({ ...empty, overrides: [{ files: ['src/**'], options: { typeAware: false } }] }, ['src/debug.js']);
record('native parser rejects root-only switch inside override', invalid, invalid.status !== 0 && /unknown field.*options/su.test(`${invalid.raw}${invalid.stderr}`));
save('packages/a/.oxlintrc.json', { ...empty, rules: { 'eslint/no-debugger': 'error' } });
save('packages/a/src/debug.js', 'debugger;\n');
const nested = run(empty, ['packages/a/src/debug.js']);
record('explicit config prevents nested policy replacement', nested, nested.status === 0 && nested.diagnostics.length === 0);

const modeCases = [
  ['src/mode.js', 'module', 'module.exports = 1;', true],
  ['packages/b/src/mode.js', 'commonjs', 'module.exports = 1;', false],
  ['packages/a/src/mode.ts', 'module', 'module.exports = 1;', true],
  ['packages/b/src/mode.ts', 'commonjs', 'module.exports = 1;', false],
  ['src/mode.cjs', 'commonjs', 'module.exports = 1;', false],
  ['src/mode.cts', 'commonjs', 'export = 1;', false],
  ['packages/b/src/mode.mjs', 'module', 'module.exports = 1;', true],
  ['packages/b/src/mode.mts', 'module', 'module.exports = 1;', true],
  ['forced/commonjs.js', 'commonjs', 'return;', false],
  ['forced/module.js', 'module', 'return;', false],
  ['forced/commonjs.mjs', 'module', 'return;', false],
  ['forced/module.cjs', 'commonjs', 'return;', false],
  ['forced/commonjs.jsx', 'commonjs', 'export const element = <div />;', false],
  ['forced/module.jsx', 'module', 'export const element = <div />;', false],
  ['forced/commonjs.ts', 'commonjs', 'export const value = 1;', false],
  ['forced/module.tsx', 'module', 'export const element = <div />;', false],
];
for (const [file, expectedMode, code, expectedFailure] of modeCases) {
  const path = save(file, `${code}\n`);
  const mode = modes.mode(path);
  const config = { ...empty, env: { builtin: true }, globals: modes.moduleGlobals, rules: { 'eslint/no-undef': 'error' }, overrides: modes.overrides };
  const nativeResult = run(config, [file]);
  const preflight = parseSync(path, code, { sourceType: mode }).errors;
  const baseline = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: [{ files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'], languageOptions: { parser: tseslint.parser, sourceType: mode, globals: mode === 'commonjs' ? globals.node : modes.moduleGlobals, parserOptions: { ecmaFeatures: { jsx: true } } }, rules: { 'no-undef': 'error' } }] });
  const old = (await baseline.lintText(code, { filePath: path }))[0];
  const failed = nativeResult.status !== 0;
  record(`module contract: ${file}`, { mode, native: nativeResult, preflight, baseline: old.messages }, mode === expectedMode && failed === expectedFailure && (old.errorCount > 0) === expectedFailure);
}

save('src/ambiguous-eval.js', "this.eval('value');\n");
const evalNative = run({ ...empty, rules: { 'eslint/no-eval': 'error' } }, ['src/ambiguous-eval.js']);
const evalBaseline = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: [{ files: ['**/*.js'], languageOptions: { parser: tseslint.parser, sourceType: 'module' }, rules: { 'no-eval': 'error' } }] });
const evalOld = (await evalBaseline.lintText("this.eval('value');\n", { filePath: join(root, 'src/ambiguous-eval.js') }))[0];
record('native parser boundary: package ESM without module syntax', { native: evalNative, baseline: evalOld.messages }, evalNative.diagnostics.some(({ code }) => code === 'eslint(no-eval)') && evalOld.errorCount === 0);

save('src/inner.mjs', 'if (true) { function value() {} }\n');
const innerImplicit = run({ ...empty, rules: { 'eslint/no-inner-declarations': 'error' } }, ['src/inner.mjs']);
const innerExplicit = run({ ...empty, rules: { 'eslint/no-inner-declarations': ['error', 'functions', { blockScopedFunctions: 'allow' }] } }, ['src/inner.mjs']);
record('retain implicit baseline inner-declaration default explicitly', { implicit: innerImplicit, explicit: innerExplicit }, innerImplicit.status === 1 && innerExplicit.status === 0);

const results = { environment: { node: process.version, platform: process.platform, arch: process.arch }, toolchain: JSON.parse(readFileSync(join(tools, 'package.json'), 'utf8')).dependencies, checks, passed: checks.filter(({ pass }) => pass).length, total: checks.length };
const normalized = JSON.stringify(results, null, 2).replaceAll(rootAlias, '<project-link>').replaceAll(root, '<project>').replaceAll(tools, '<tools>');
writeFileSync(destination, `${normalized}\n`);
console.log(`${results.passed}/${results.total} configuration contracts passed; evidence: ${destination}`);
console.log(`Isolated fixture: ${root}`);
assert.equal(results.passed, results.total, checks.filter(({ pass }) => !pass).map(({ name }) => name).join(', '));
