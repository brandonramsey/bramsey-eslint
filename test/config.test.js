/* eslint-disable no-await-in-loop -- Exercise profile cases sequentially against shared project-service state. */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

import config, { createConfig } from '../src/index.js';

const root = fileURLToPath(new URL('./fixtures/project', import.meta.url));
const policy = createConfig({ projectRoot: root, syntaxOnlyFiles: ['tools/**/*.ts'] });
const eslint = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: policy });

async function lint(code, file = 'src/source.ts', engine = eslint) {
  const [result] = await engine.lintText(code, { filePath: resolve(root, file) });
  assert.ok(result);
  return result;
}

async function violations(code, file) {
  return (await lint(code, file)).messages.map((message) => message.ruleId);
}

test('default export is a flat array and factory requires an absolute root', () => {
  assert.ok(Array.isArray(config));
  assert.throws(() => createConfig({ projectRoot: '.' }), /absolute/);
});

test('representative valid TypeScript passes without findings', async () => {
  assert.deepEqual((await lint('export const value = 1;\n')).messages, []);
});

test('floating promises cannot be hidden with void', async () => {
  assert.ok((await violations('void Promise.resolve(1);\n')).includes('@typescript-eslint/no-floating-promises'));
});

test('typed checks reject nullable primitive truthiness and misused callbacks', async () => {
  const messages = await violations('export function check(value: string | undefined): void {\n  if (value) {\n    console.log(value);\n  }\n  [1].forEach(async () => {\n    await Promise.resolve();\n  });\n}\n');
  assert.ok(messages.includes('@typescript-eslint/strict-boolean-expressions'));
  assert.ok(messages.includes('@typescript-eslint/no-misused-promises'));
});

test('nullable-object presence is permitted', async () => {
  const messages = await violations('export function check(value: { name: string } | undefined): void {\n  if (value) {\n    console.log(value.name);\n  }\n}\n');
  assert.ok(!messages.includes('@typescript-eslint/strict-boolean-expressions'));
});

test('async returns require return await', async () => {
  assert.ok((await violations('export async function getValue(): Promise<number> {\n  return Promise.resolve(1);\n}\n')).includes('@typescript-eslint/return-await'));
});

test('new throws must be errors while unknown direct rethrows are permitted', async () => {
  assert.ok((await violations("throw 'failure';\n")).includes('@typescript-eslint/only-throw-error'));
  assert.ok(!(await violations('try {\n  console.log(1);\n}\ncatch (error) {\n  throw error;\n}\n')).includes('@typescript-eslint/only-throw-error'));
});

test('strict coercion and Promise rejection values are checked', async () => {
  // eslint-disable-next-line no-template-curly-in-string -- This is TypeScript source supplied to the lint engine.
  const messages = await violations("export const message = `value: ${42}`;\nexport const mixed = 'value: ' + 42;\nPromise.resolve().catch((error) => console.error(error));\n");
  assert.ok(messages.includes('@typescript-eslint/restrict-template-expressions'));
  assert.ok(messages.includes('@typescript-eslint/restrict-plus-operands'));
  assert.ok(messages.includes('@typescript-eslint/use-unknown-in-catch-callback-variable'));
});

test('accurate indexed types retain necessary undefined checks', async () => {
  const messages = await violations('export function lookup(values: string[]): string | undefined {\n  const value = values[0];\n  if (value === undefined) {\n    return undefined;\n  }\n  return value;\n}\n');
  assert.ok(!messages.includes('@typescript-eslint/no-unnecessary-condition'));
});

test('unnecessary conditions are rejected', async () => {
  assert.ok((await violations('export function check(value: string): void {\n  if (value !== undefined) {\n    console.log(value);\n  }\n}\n')).includes('@typescript-eslint/no-unnecessary-condition'));
});

test('production bans any, assertions, interfaces, enums, and unexplained suppression', async () => {
  const messages = await violations('export interface Item { value: any }\nexport enum Status { Ready }\nexport const value = [1][0]!;\n// @ts-ignore\nexport const ignored = missing;\n');
  for (const rule of ['@typescript-eslint/no-explicit-any', '@typescript-eslint/no-non-null-assertion', '@typescript-eslint/consistent-type-definitions', 'no-restricted-syntax', '@typescript-eslint/ban-ts-comment']) {
    assert.ok(messages.includes(rule), rule);
  }
});

test('external property names and original destructured keys remain valid', async () => {
  const messages = await violations('export type ApiValue = { external_name: string };\nexport function read(value: ApiValue): string {\n  const { external_name } = value;\n  return external_name;\n}\n');
  assert.ok(!messages.includes('@typescript-eslint/naming-convention'));
  const renamed = await violations('export function read(value: { external_name: string }): string {\n  const { external_name: invalid_name } = value;\n  return invalid_name;\n}\n');
  assert.ok(renamed.includes('@typescript-eslint/naming-convention'));
});

test('tests allow fixture any, assertions, and inferred exported returns', async () => {
  const code = 'export function fixture(value: any) {\n  return value.member! as string;\n}\n';
  const messages = await violations(code, 'src/source.test.ts');
  for (const rule of ['@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unsafe-member-access', '@typescript-eslint/no-unsafe-type-assertion', '@typescript-eslint/no-non-null-assertion', '@typescript-eslint/explicit-module-boundary-types']) {
    assert.ok(!messages.includes(rule), rule);
  }
  assert.ok((await violations('Promise.resolve(1);\n', 'src/source.test.ts')).includes('@typescript-eslint/no-floating-promises'));
});

test('test profile is automatic, extensible, and can be disabled', async () => {
  const strict = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: createConfig({ projectRoot: root, tests: false }) });
  assert.ok((await lint('export const value: any = 1;\n', 'src/source.test.ts', strict)).messages.some((message) => message.ruleId === '@typescript-eslint/no-explicit-any'));
  const custom = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: createConfig({ projectRoot: root, testFiles: ['src/source.ts'] }) });
  assert.ok(!(await lint('export const value: any = 1;\n', 'src/source.ts', custom)).messages.some((message) => message.ruleId === '@typescript-eslint/no-explicit-any'));
});

test('structural limits apply to source and are disabled in tests', async () => {
  const code = 'export function many(a: number, b: number, c: number, d: number, e: number): number {\n  return a + b + c + d + e;\n}\n';
  assert.ok((await violations(code)).includes('max-params'));
  assert.ok(!(await violations(code, 'src/source.test.ts')).includes('max-params'));
});

test('files outside tsconfig fail unless explicitly syntax-only', async () => {
  const excluded = await lint('export const value = 1;\n', 'outside.ts');
  assert.ok(excluded.messages.some((message) => message.fatal && message.message.includes('project service')));
  const syntax = await lint('export const config = true;\n', 'tools/config.ts');
  assert.deepEqual(syntax.messages, []);
  const resolved = await eslint.calculateConfigForFile(resolve(root, 'tools/config.ts'));
  assert.equal(resolved.rules['@typescript-eslint/no-floating-promises'], undefined);
});

test('declarations allow augmentation constructs while retaining the any ban', async () => {
  const code = 'export {};\ndeclare global {\n  interface Existing { external_name: string }\n  var existing: Existing;\n  namespace Legacy {\n    enum Status { Ready }\n  }\n}\n';
  const messages = await violations(code, 'src/ambient.d.ts');
  for (const rule of ['no-var', 'no-restricted-syntax', '@typescript-eslint/consistent-type-definitions', '@typescript-eslint/no-namespace']) {
    assert.ok(!messages.includes(rule), rule);
  }
  assert.ok((await violations('export type Value = any;\n', 'src/ambient.d.ts')).includes('@typescript-eslint/no-explicit-any'));
});

test('JSX and TSX parse without framework dependencies', async () => {
  for (const file of ['src/source.jsx', 'src/element.tsx']) {
    const result = await lint('export const element = <div title="hello" />;\n', file);
    assert.ok(!result.messages.some((message) => message.fatal), file);
  }
});

test('package boundaries and explicit extensions select ESM/CommonJS', async () => {
  for (const [file, mode] of [['src/source.js', 'module'], ['src/source.cjs', 'commonjs'], ['src/source.cts', 'commonjs'], ['packages/two/src/legacy.js', 'commonjs'], ['packages/one/src/value.ts', 'module']]) {
    assert.equal((await eslint.calculateConfigForFile(resolve(root, file))).languageOptions.sourceType, mode);
  }
  assert.deepEqual((await lint('module.exports = 1;\n', 'src/source.cjs')).messages, []);
  assert.ok((await violations('module.exports = 1;\n', 'src/source.js')).includes('no-undef'));
  assert.ok(!(await lint('export = 1;\n', 'src/source.cts')).messages.some((message) => message.fatal));
});

test('production notation and private readonly conventions are enforced', async () => {
  const messages = await violations('export type Items = Array<string>;\nexport type Dictionary = { [key: string]: string };\nexport class Holder {\n  private value = 1;\n  getValue(): number {\n    return this.value;\n  }\n}\n');
  for (const rule of ['@typescript-eslint/array-type', '@typescript-eslint/consistent-indexed-object-style', '@typescript-eslint/prefer-readonly']) {
    assert.ok(messages.includes(rule), rule);
  }
});

test('dynamic deletion, empty functions, static-only classes, and index-only loops are rejected', async () => {
  const messages = await violations('export function remove(value: Record<string, string>, key: string): void {\n  delete value[key];\n}\nexport function empty(): void {}\nexport class OnlyStatic {\n  static value = 1;\n}\nexport function visit(values: string[]): void {\n  for (let index = 0; index < values.length; index++) {\n    console.log(values[index]);\n  }\n}\n');
  for (const rule of ['@typescript-eslint/no-dynamic-delete', '@typescript-eslint/no-empty-function', '@typescript-eslint/no-extraneous-class', '@typescript-eslint/prefer-for-of']) {
    assert.ok(messages.includes(rule), rule);
  }
});

test('a comment permits a deliberately empty function', async () => {
  const messages = await violations('export function intentional(): void {\n  // No operation is required for this adapter.\n}\n');
  assert.ok(!messages.includes('@typescript-eslint/no-empty-function'));
});

test('type-only imports fix into separate declarations without oscillation', async () => {
  const fixing = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: policy, fix: true });
  const code = "import { type ApiValue } from './api-value.js';\n\nexport function read(value: ApiValue): string {\n  return value.external_name;\n}\n";
  const first = await lint(code, 'src/source.ts', fixing);
  assert.ok(first.output.includes('import type { ApiValue }'));
  const second = await lint(first.output, 'src/source.ts', fixing);
  assert.equal(second.output, undefined);
  assert.deepEqual(second.messages, []);
});

test('monorepo typed projects and TypeScript aliases resolve', async () => {
  assert.deepEqual((await lint('export const value = 1;\n', 'packages/one/src/value.ts')).messages, []);
  const alias = await violations("import { value } from '@one/value';\n\nexport const result = value;\n");
  assert.ok(!alias.includes('import-x/no-unresolved'));
  assert.ok((await violations("import { value } from './does-not-exist.js';\n\nconsole.log(value);\n")).includes('import-x/no-unresolved'));
});

test('formatting fixes are stable and preserve side-effect ordering', async () => {
  const fixing = new ESLint({ cwd: root, overrideConfigFile: true, overrideConfig: policy, fix: true });
  const code = 'import "./side-effect-b.js";\nimport "./side-effect-a.js";\nexport const message = "hello"\n';
  const first = await lint(code, 'src/source.js', fixing);
  assert.ok(first.output.indexOf('side-effect-b') < first.output.indexOf('side-effect-a'));
  assert.ok(first.output.includes("'hello';"));
  const second = await lint(first.output, 'src/source.js', fixing);
  assert.equal(second.output, undefined);
  assert.deepEqual(second.messages, []);
});

test('inline exceptions need descriptions and unused exceptions are errors', async () => {
  const missing = await violations('/* eslint-disable no-debugger */\ndebugger;\n', 'src/source.js');
  assert.ok(missing.includes('@eslint-community/eslint-comments/require-description'));
  const explained = await lint('// eslint-disable-next-line no-debugger -- Interactive troubleshooting.\ndebugger;\n', 'src/source.js');
  assert.deepEqual(explained.messages, []);
  const unused = await lint('// eslint-disable-next-line no-debugger -- Interactive troubleshooting.\nconsole.log(1);\n', 'src/source.js');
  assert.ok(unused.messages.some((message) => message.message.includes('Unused eslint-disable') && message.severity === 2));
});

test('Node APIs enforce protocol and exitCode while allowing synchronous APIs', async () => {
  const messages = await violations("import fs from 'fs';\n\nfs.readFileSync('file');\nprocess.exit(0);\n", 'src/source.js');
  assert.ok(messages.includes('n/prefer-node-protocol'));
  assert.ok(messages.includes('n/no-process-exit'));
  assert.ok(!messages.includes('n/no-sync'));
});

test('generated output and dependencies are ignored', async () => {
  for (const file of ['dist/output.ts', 'build/output.js', 'coverage/output.js', 'node_modules/library/index.js']) {
    assert.ok(await eslint.isPathIgnored(resolve(root, file)), file);
  }
});

test('every configured rule exists and enabled severities are errors', async () => {
  for (const file of ['src/source.js', 'src/source.ts', 'src/source.test.ts', 'src/ambient.d.ts', 'tools/config.ts']) {
    const resolved = await eslint.calculateConfigForFile(resolve(root, file));
    for (const [name, setting] of Object.entries(resolved.rules)) {
      assert.ok(setting[0] === 0 || setting[0] === 2, name);
    }
  }
});
