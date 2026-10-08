import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { exportCases } from './fixtures.mjs';

const toolRoot = resolve(process.argv[2] ?? '/private/tmp/bramsey-oxlint-candidate-tools');
const mode = process.argv[3] ?? 'original';
const root = realpathSync(mkdtempSync(join(tmpdir(), 'bramsey-export-probe-')));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(root, 'tsconfig.json'), '{"compilerOptions":{"allowJs":true,"module":"NodeNext","target":"ES2022"},"include":["**/*"]}');
const parserUrl = new URL('./export-parser.mjs', import.meta.url).href;
const graphUrl = new URL('./export-graph.mjs', import.meta.url).href;
writeFileSync(join(root, 'plugin.mjs'), `
import { createRequire } from 'node:module';
import { createExportParser } from ${JSON.stringify(parserUrl)};
const require = createRequire(${JSON.stringify(pathToFileURL(join(toolRoot, 'package.json')).href)});
const plugin = (await import(require.resolve('eslint-plugin-import-x'))).default;
const { parseSync, visitorKeys } = await import(require.resolve('oxc-parser'));
const { createTypeScriptImportResolver } = await import(require.resolve('eslint-import-resolver-typescript'));
const parser = createExportParser(parseSync, visitorKeys);
const settings = { 'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'], 'import-x/resolver-next': [createTypeScriptImportResolver({ project: ${JSON.stringify(join(root, 'tsconfig.json'))} })] };
const rule = ${mode === 'original' ? 'plugin.rules.export' : `(await import(${JSON.stringify(graphUrl)})).createExportGraphRule((await import(require.resolve('eslint-plugin-import-x/utils'))).ExportMap, parser, plugin.rules.export)`};
export default { rules: { export: { ...rule, create(context) {
  return rule.create(Object.create(context, { settings: { value: settings }, languageOptions: { value: { ...context.languageOptions, parser } } }));
} } } };
`);
writeFileSync(join(root, '.oxlintrc.json'), JSON.stringify({ categories: { correctness: 'off' }, plugins: [], jsPlugins: [{ name: 'probe', specifier: './plugin.mjs' }], rules: { 'probe/export': 'error' } }));
const results = [];
for (const [name, files, entry, expectedCount] of exportCases.filter(([caseName]) => !process.argv[4] || caseName === process.argv[4])) {
  const directory = join(root, name);
  mkdirSync(directory, { recursive: true });
  for (const [file, code] of Object.entries(files)) {
    writeFileSync(join(directory, file), code);
  }
  const child = spawnSync(process.execPath, [join(toolRoot, 'node_modules/oxlint/bin/oxlint'), '-c', '.oxlintrc.json', '--format', 'json', '--threads', '1', `${name}/${entry}`], { cwd: root, encoding: 'utf8', timeout: 10000 });
  const output = JSON.parse(child.stdout);
  const diagnostics = output.diagnostics;
  const pass = diagnostics.length === expectedCount && !diagnostics.some((item) => item.message.startsWith('Error running JS plugin.')) && child.status === (expectedCount ? 1 : 0);
  results.push({ name, expectedCount, status: child.status, diagnostics, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: expected ${expectedCount}, got ${diagnostics.length}${diagnostics.some((item) => item.message.includes('Maximum call stack')) ? ' (stack overflow)' : ''}`);
}
const destination = new URL(`./export-${mode}-results.json`, import.meta.url);
writeFileSync(destination, `${JSON.stringify({ mode, results }, null, 2).replaceAll(root, '<project>').replaceAll(toolRoot, '<tools>')}\n`);
process.exitCode = results.every((item) => item.pass) ? 0 : 1;
