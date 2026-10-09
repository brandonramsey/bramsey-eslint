import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createConfig } from '@brandonramsey/eslint';

const root = fileURLToPath(new URL('./fixtures/project', import.meta.url));

test('resolver options are rooted, discover workspace projects and retain consumer settings', () => {
  const policy = createConfig({ projectRoot: root, resolverOptions: { extensions: ['.custom'], alwaysTryTypes: false } });
  assert.deepEqual(policy.settings.policy, {
    projectRoot: root,
    resolverOptions: {
      alwaysTryTypes: false,
      extensions: ['.custom'],
      project: [`${root}/packages/one/tsconfig.json`, `${root}/packages/two/tsconfig.json`, `${root}/tsconfig.json`],
    },
  });
  assert.deepEqual(policy.settings.n, { version: '>=24.0.0' });
  assert.deepEqual(policy.settings['import-x/extensions'], ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts']);
});

test('explicit resolver projects accept custom filenames and reject empty matches and malformed options', () => {
  const policy = createConfig({ projectRoot: root, resolverOptions: { project: 'packages/one/tsconfig.app.json' } });
  assert.deepEqual(policy.settings.policy.resolverOptions.project, [`${root}/packages/one/tsconfig.app.json`]);
  for (const resolverOptions of [null, [], { project: [] }, { project: [''] }, { project: ['missing.json'] }, { project: ['tsconfig.json', 'missing.json'] }, { tsconfig: 'auto' }, { alwaysTryTypes: 'yes' }, { unexpected: true }, { extensions: [42] }]) {
    assert.throws(() => createConfig({ projectRoot: root, resolverOptions }), /resolver/i);
  }
});

test('independent roots expose only their own resolver projects and an empty fallback list', () => {
  const workspace = createConfig({ projectRoot: `${root}/packages/one` });
  assert.deepEqual(workspace.settings.policy, {
    projectRoot: `${root}/packages/one`,
    resolverOptions: { alwaysTryTypes: true, project: [`${root}/packages/one/tsconfig.json`] },
  });
  const withoutProject = createConfig({ projectRoot: `${root}/src` });
  assert.deepEqual(withoutProject.settings.policy, {
    projectRoot: `${root}/src`,
    resolverOptions: { alwaysTryTypes: true, project: [] },
  });
});

test('bundled compatibility plugin exports configured import, runtime, polyfill and CommonJS rules', async () => {
  const { default: plugin } = await import('@brandonramsey/eslint/plugins/policy');
  const policy = createConfig({ projectRoot: root });
  const required = ['no-dupe-args', 'no-octal', 'no-unresolved', 'no-useless-path-segments', 'no-extraneous-dependencies', 'order', 'no-deprecated-api', 'node-builtins', 'es-builtins', 'no-process-exit', 'prefer-node-protocol', 'no-unnecessary-polyfills'];
  assert.deepEqual(Object.keys(plugin.rules).sort(), [...required, 'no-restricted-syntax'].sort());
  for (const name of required) {
    assert.equal(typeof plugin.rules[name].create, 'function');
    assert.equal(Array.isArray(policy.rules[`policy/${name}`]) ? policy.rules[`policy/${name}`][0] : policy.rules[`policy/${name}`], 'error');
  }
  assert.deepEqual(policy.rules['policy/no-unresolved'], ['error', { commonjs: true, caseSensitive: true }]);
  assert.deepEqual(policy.rules['policy/no-extraneous-dependencies'], ['error', { devDependencies: true }]);
  const syntax = policy.overrides.find((entry) => entry.rules?.['eslint/id-match']);
  assert.equal(syntax.rules['policy/no-dupe-args'], 'off');
  assert.deepEqual(syntax.rules['policy/no-restricted-syntax'], ['error', { selector: 'TSEnumDeclaration', message: 'Use a union or const object instead of an enum.' }]);
  const declaration = policy.overrides.find((entry) => entry.rules?.['typescript/no-namespace'] === 'off');
  for (const name of ['no-restricted-syntax', 'no-octal', 'no-deprecated-api', 'node-builtins', 'es-builtins', 'no-process-exit', 'prefer-node-protocol', 'no-unnecessary-polyfills']) {
    assert.equal(declaration.rules[`policy/${name}`], 'off');
  }
});

test('factory rejects unsupported and malformed native override shapes', () => {
  assert.throws(() => createConfig({ projectRoot: root, overrides: [{ files: ['**/*.ts'], rules: [] }] }), /override.rules/);
});

test('factory rejects malformed plugin lists in native overrides', () => {
  assert.throws(() => createConfig({ projectRoot: root, overrides: [{ files: ['**/*.ts'], plugins: 'typescript' }] }), /override.plugins/);
  assert.throws(() => createConfig({ projectRoot: root, overrides: [{ files: ['**/*.ts'], jsPlugins: [{}] }] }), /specifier/);
});

test('native defaults and all validated Stylistic settings are explicit', async () => {
  const { readFileSync } = await import('node:fs');
  const { default: config } = await import('@brandonramsey/eslint');
  const expected = JSON.parse(readFileSync(new URL('../docs/research/oxlint-candidate/results.json', import.meta.url), 'utf8')).candidate;
  const styleSettings = (rules) => Object.fromEntries(Object.entries(rules).filter(([id]) => id.startsWith('style/')));
  assert.equal(Array.isArray(config), false);
  assert.deepEqual(config.categories, { correctness: 'off' });
  assert.deepEqual(config.plugins, ['typescript', 'import', 'node', 'unicorn']);
  assert.deepEqual(config.options, { typeAware: true, reportUnusedDisableDirectives: 'error' });
  assert.deepEqual(config.rules['eslint/no-inner-declarations'], ['error', 'functions', { blockScopedFunctions: 'allow' }]);
  assert.equal(config.rules['unicorn/no-abusive-eslint-disable'], 'error');
  assert.equal(Object.keys(styleSettings(config.rules)).length, 66);
  assert.deepEqual(styleSettings(config.rules), styleSettings(expected.rules));
});

test('typed safety, declaration exemptions and syntax-only exemptions compose', () => {
  const policy = createConfig({ projectRoot: root, syntaxOnlyFiles: ['tools/**/*.ts'] });
  const typed = policy.overrides.find((entry) => entry.rules?.['typescript/no-floating-promises']?.[0] === 'error');
  assert.deepEqual(typed.files, ['**/*.{ts,tsx,mts,cts}']);
  assert.deepEqual(typed.excludeFiles, ['**/*.d.{ts,mts,cts}', 'tools/**/*.ts']);
  assert.deepEqual(typed.rules['typescript/no-floating-promises'], ['error', { ignoreVoid: false, ignoreIIFE: false, checkThenables: true }]);
  assert.equal(typed.rules['typescript/no-unsafe-member-access'], 'error');
  const exempt = policy.overrides.at(-1);
  assert.deepEqual(exempt.files, ['**/*.d.{ts,mts,cts}', 'tools/**/*.ts']);
  assert.equal(Object.keys(exempt.rules).length, 48);
  assert.ok(Object.values(exempt.rules).every((setting) => setting === 'off'));
  const declaration = policy.overrides.find((entry) => entry.rules?.['typescript/no-namespace'] === 'off');
  assert.deepEqual(declaration.files, ['**/*.d.{ts,mts,cts}']);
  assert.equal(declaration.rules['typescript/consistent-type-definitions'], 'off');
  assert.equal(declaration.rules['eslint/no-inner-declarations'], 'off');
  assert.equal(declaration.rules['unicorn/no-abusive-eslint-disable'], undefined);
  const syntax = policy.overrides.find((entry) => entry.rules?.['eslint/id-match']);
  assert.deepEqual(syntax.rules['eslint/id-match'], ['error', '^_?(?:[a-z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)$', { onlyDeclarations: true, properties: false, ignoreDestructuring: true }]);
  assert.equal(syntax.rules['typescript/no-explicit-any'], 'error');
});

test('test profile is automatic, extensible and optional while retaining promise checks', () => {
  const policy = createConfig({ projectRoot: root, testFiles: ['fixtures/**'] });
  const tests = policy.overrides.find((entry) => entry.rules?.['typescript/no-explicit-any'] === 'off');
  assert.deepEqual(tests.files, ['**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}', '**/__tests__/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}', 'fixtures/**']);
  assert.deepEqual(tests.excludeFiles, ['**/*.d.{ts,mts,cts}']);
  assert.equal(tests.rules['typescript/no-floating-promises'], undefined);
  assert.equal(tests.rules['typescript/no-misused-promises'], undefined);
  assert.equal(tests.rules['typescript/no-unsafe-member-access'], 'off');
  assert.equal(createConfig({ projectRoot: root, tests: false }).overrides.some((entry) => entry.rules?.['typescript/no-explicit-any'] === 'off'), false);
});

test('package-aware globals and explicit patterns respect dedicated extensions', () => {
  const policy = createConfig({ projectRoot: root, commonjsFiles: ['shared/**'], moduleFiles: ['shared/**'] });
  const modes = policy.overrides.filter((entry) => entry.globals);
  assert.equal(modes.find((entry) => entry.files[0] === '**/*.{js,jsx,ts,tsx}').globals.require, 'off');
  assert.equal(modes.find((entry) => entry.files[0] === 'packages/two/**/*.{js,jsx,ts,tsx}').globals.require, 'readonly');
  assert.deepEqual(modes.slice(-4).map((entry) => [entry.files, entry.globals.require]), [
    [['shared/**'], 'readonly'],
    [['shared/**'], 'off'],
    [['**/*.{cjs,cts}'], 'readonly'],
    [['**/*.{mjs,mts}'], 'off'],
  ]);
  assert.ok(modes.every((entry) => entry.languageOptions === undefined && entry.sourceType === undefined));
});

test('ignore extension and consumer overrides are last without sharing mutable policy', () => {
  const override = { files: ['tools/**'], rules: { 'typescript/no-floating-promises': 'warn' }, globals: { external: 'readonly' } };
  const options = { projectRoot: root, ignores: ['generated/**'], overrides: [override] };
  const policy = createConfig(options);
  assert.deepEqual(policy.ignorePatterns, ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**', 'generated/**']);
  assert.deepEqual(policy.overrides.at(-1), override);
  override.rules['typescript/no-floating-promises'] = 'off';
  assert.equal(policy.overrides.at(-1).rules['typescript/no-floating-promises'], 'warn');
  policy.rules['style/semi'][1] = 'never';
  assert.deepEqual(createConfig({ projectRoot: root }).rules['style/semi'], ['error', 'always']);
});

test('factory rejects ESLint fields, root-only override fields and invalid options', () => {
  for (const field of ['languageOptions', 'options', 'settings', 'ignores']) {
    assert.throws(() => createConfig({ projectRoot: root, overrides: [{ files: ['**/*.ts'], [field]: {} }] }), new RegExp(field));
  }
  for (const options of [null, [], { syntaxOnlyFiles: 'tools/**' }, { tests: 'yes' }, { projectRoot: '.' }, { overrides: {} }, { overrides: [null] }, { unrelated: true }]) {
    assert.throws(() => createConfig(options), TypeError);
  }
});

test('symlink project roots produce the same canonical public configuration', async () => {
  const { mkdtempSync, rmSync, symlinkSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = mkdtempSync(join(tmpdir(), 'lint-config-contract-'));
  try {
    const alias = join(directory, 'project');
    symlinkSync(root, alias, 'dir');
    assert.deepEqual(createConfig({ projectRoot: alias }), createConfig({ projectRoot: root }));
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
