import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'bramsey-eslint-consumer-'));
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, cwd = directory) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
const [packed] = JSON.parse(run(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], root));
assert.ok(packed.files.some((file) => file.path === 'src/index.d.ts'));
assert.ok(packed.files.some((file) => file.path === 'examples/rules/typescript-esm.mjs'));
assert.ok(!packed.files.some((file) => file.path.startsWith('.agents/') || file.path.startsWith('test/')));
writeFileSync(join(directory, 'package.json'), JSON.stringify({
  name: 'consumer-check', private: true, type: 'module',
  devDependencies: {
    '@brandonramsey/eslint': `file:${join(directory, packed.filename)}`,
    eslint: process.env.TEST_ESLINT_VERSION ?? manifest.devDependencies.eslint,
    typescript: process.env.TEST_TYPESCRIPT_VERSION ?? manifest.devDependencies.typescript,
  },
}));
run(npm, ['install', '--no-audit', '--no-fund']);
writeFileSync(join(directory, 'eslint.config.mjs'), "import config from '@brandonramsey/eslint';\n\nexport default config;\n");
writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noUncheckedIndexedAccess: true, module: 'NodeNext', target: 'ES2024' }, include: ['*.ts'] }));
writeFileSync(join(directory, 'valid.ts'), 'export const value = 1;\n');
writeFileSync(join(directory, 'config-types.ts'), "import config, { createConfig } from '@brandonramsey/eslint';\n\nexport const configs = [config, createConfig({ syntaxOnlyFiles: ['tools/**/*.ts'] })];\n");
run(process.execPath, ['node_modules/eslint/bin/eslint.js', 'valid.ts', 'config-types.ts']);
run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit']);
writeFileSync(join(directory, 'invalid.ts'), 'void Promise.resolve(1);\n');
assert.throws(() => run(process.execPath, ['node_modules/eslint/bin/eslint.js', 'invalid.ts']), (error) => error.stdout.includes('@typescript-eslint/no-floating-promises'));
const installed = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
assert.deepEqual(Object.keys(installed.devDependencies).sort(), ['@brandonramsey/eslint', 'eslint', 'typescript']);
console.log(`Packed consumer passed with only package, ESLint, and project TypeScript installed directly. Fixture: ${directory}`);
