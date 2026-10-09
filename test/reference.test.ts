import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createConfig } from '@brandonramsey/lint';

import type { ConfigOptions, OxlintConfig } from '@brandonramsey/lint';

const root = fileURLToPath(new URL('../../test/fixtures/project', import.meta.url));
const exampleURL = new URL('../../examples/complete-config.mjs', import.meta.url);

function equivalent(example: OxlintConfig, normal: OxlintConfig): void {
  assert.ok(example.rules);
  for (const [id, setting] of Object.entries(normal.rules ?? {})) {
    assert.deepEqual(example.rules[id], setting, id);
  }
  for (const [id, setting] of Object.entries(example.rules)) {
    if (normal.rules?.[id] === undefined) {
      assert.equal(setting, 'off', `Unconfigured ${id} must stay off`);
    }
  }
  assert.deepEqual({ ...example, rules: undefined }, { ...normal, rules: undefined });
}

await test('the complete editable example preserves defaults, profiles and consumer-derived paths', async () => {
  const example: { default: OxlintConfig; createExample: (options?: ConfigOptions) => OxlintConfig } = await import(exampleURL.href);
  equivalent(example.default, createConfig());
  const selections: ConfigOptions[] = [
    { projectRoot: root },
    { projectRoot: `${root}/packages/one`, tests: false },
    {
      projectRoot: root,
      syntaxOnlyFiles: ['tools/**/*.{ts,cts}'],
      testFiles: ['fixtures/**'],
      commonjsFiles: ['shared/**'],
      moduleFiles: ['shared/module/**'],
      ignores: ['generated/**'],
      resolverOptions: { project: 'packages/one/tsconfig.app.json', alwaysTryTypes: false },
      overrides: [{ files: ['tools/**'], rules: { 'typescript/no-floating-promises': 'warn' } }],
    },
  ];
  for (const options of selections) {
    equivalent(example.createExample(options), createConfig(options));
  }
  const mutated = example.createExample({ projectRoot: root });
  assert.ok(mutated.rules);
  mutated.rules['style/semi'] = 'off';
  const typed = mutated.overrides?.find((entry) => entry.rules?.['typescript/no-floating-promises'] !== undefined);
  assert.ok(typed?.rules);
  typed.rules['typescript/no-floating-promises'] = 'off';
  equivalent(example.createExample({ projectRoot: root }), createConfig({ projectRoot: root }));
  assert.doesNotMatch(readFileSync(exampleURL, 'utf8'), /test\/fixtures|legacy-eslint|\/Users\/|\/private\//);
});

await test('reference drift checks reject stale inventory, options, example and summary', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint-reference-'));
  const examples = fileURLToPath(new URL('../../examples', import.meta.url));
  const generator = fileURLToPath(new URL('../scripts/generate-reference.js', import.meta.url));
  try {
    cpSync(examples, directory, { recursive: true });
    const check = () => spawnSync(process.execPath, [generator, '--check', '--output', directory], { encoding: 'utf8' });
    const clean = check();
    assert.equal(clean.status, 0, clean.stderr);
    const changes: Array<[string, string, string]> = [
      ['rules/javascript-esm.mjs', '"eslint/accessor-pairs": "off",', ''],
      ['rules/typescript-esm.mjs', '"ignoreVoid": false', '"ignoreVoid": true'],
      ['complete-config.mjs', '"style/semi": [', '"style/semi-stale": ['],
      ['README.md', '# Native Oxlint rule reference', '# Stale summary'],
    ];
    for (const [path, before, after] of changes) {
      const destination = join(directory, path);
      const original = readFileSync(destination, 'utf8');
      assert.ok(original.includes(before), `Expected drift target in ${path}`);
      writeFileSync(destination, original.replace(before, after));
      const stale = check();
      assert.notEqual(stale.status, 0, `Drift in ${path} was missed`);
      assert.ok(stale.stderr.includes(path), stale.stderr);
      writeFileSync(destination, original);
    }
    rmSync(join(directory, 'rules/declarations-esm.mjs'));
    const missing = check();
    assert.notEqual(missing.status, 0);
    assert.ok(missing.stderr.includes('rules/declarations-esm.mjs'));
    const generated = spawnSync(process.execPath, [generator, '--output', directory], { encoding: 'utf8' });
    assert.equal(generated.status, 0, generated.stderr);
    for (const path of ['README.md', 'complete-config.mjs', ...readdirSync(join(examples, 'rules')).map((name) => `rules/${name}`)]) {
      assert.equal(readFileSync(join(directory, path), 'utf8'), readFileSync(join(examples, path), 'utf8'), `Nondeterministic ${path}`);
    }
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

await test('all native reference profiles include disabled inventory, configured options and distinct exemptions', async () => {
  const schema: { definitions: { DummyRuleMap: { properties: Record<string, unknown> } } } = JSON.parse(readFileSync(new URL('configuration_schema.json', import.meta.resolve('oxlint/package.json')), 'utf8'));
  const [{ default: style }, { default: policy }] = await Promise.all([
    import('@brandonramsey/lint/plugins/style'),
    import('@brandonramsey/lint/plugins/policy'),
  ]);
  const inventory = [
    ...Object.keys(schema.definitions.DummyRuleMap.properties).map((name) => name.includes('/') ? name : `eslint/${name}`),
    ...Object.keys(style.rules).map((name) => `style/${name}`),
    ...Object.keys(policy.rules).map((name) => `policy/${name}`),
  ].sort();
  const profileDirectory = new URL('../../examples/rules/', import.meta.url);
  const names = readdirSync(profileDirectory).sort();
  assert.equal(names.length, 14);
  await Promise.all(names.map(async (name) => {
    const { default: profile }: { default: OxlintConfig } = await import(new URL(name, profileDirectory).href);
    assert.ok(profile.rules);
    assert.deepEqual(Object.keys(profile.rules).sort(), inventory, name);
    assert.deepEqual(profile.options, { typeAware: true, reportUnusedDisableDirectives: 'error' });
    assert.equal(profile.globals?.require, name.includes('commonjs') ? 'readonly' : 'off');
    assert.equal(profile.rules['eslint/accessor-pairs'], 'off');
    assert.equal(profile.rules['react/jsx-key'], 'off');
    assert.equal(profile.rules['unicorn/no-abusive-eslint-disable'], 'error');
    assert.deepEqual(profile.rules['style/semi'], ['error', 'always']);
    assert.deepEqual(profile.rules['policy/no-unresolved'], ['error', { commonjs: true, caseSensitive: true }]);
    const typed = name.startsWith('typescript') && !name.includes('syntax');
    assert.deepEqual(profile.rules['typescript/no-floating-promises'], typed
      ? ['error', { ignoreVoid: false, ignoreIIFE: false, checkThenables: true }]
      : 'off');
    assert.equal(profile.rules['typescript/no-explicit-any'], name.startsWith('javascript') || name.includes('-test-') ? 'off' : 'error');
    assert.equal(profile.rules['typescript/no-namespace'], name.startsWith('declarations') || name.startsWith('javascript') ? 'off' : 'error');
    assert.deepEqual(profile.rules['eslint/complexity'], name.includes('-test-') || name.startsWith('declarations') ? 'off' : ['error', { max: 10 }]);
  }));
});

await test('the editable example retains public factory validation for consumer overrides', async () => {
  const { createExample }: { createExample: (options?: ConfigOptions) => OxlintConfig } = await import(exampleURL.href);
  assert.throws(() => Reflect.apply(createExample, undefined, [{ projectRoot: root, overrides: [{ files: ['**/*.ts'], settings: {} }] }]), /settings/);
  assert.throws(() => Reflect.apply(createExample, undefined, [{ projectRoot: root, overrides: [{ files: ['**/*.ts'], rules: [] }] }]), /rules/);
});
