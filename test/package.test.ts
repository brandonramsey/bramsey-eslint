import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type * as PublicModule from '@brandonramsey/eslint';

type PackedArtifact = { filename: string; files: Array<{ path: string }> };
type PackageManifest = {
  name: string;
  exports: Record<string, { types: string; import: string }>;
  engines: { node: string };
  peerDependencies: Record<string, string>;
  dependencies: Record<string, string | undefined>;
  devDependencies: Record<string, string | undefined>;
  bin?: unknown;
};

const repository = fileURLToPath(new URL('../../', import.meta.url));

await test('packed public modules, declarations, dependencies and plugin specifiers are self-contained', async () => {
  // Unpack inside node_modules so bundled providers resolve normally; install nothing.
  const directory = mkdtempSync(join(repository, 'node_modules/.lint-package-contract-'));
  try {
    const pack = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory, '--cache', join(directory, 'cache')], { cwd: repository, encoding: 'utf8' });
    assert.equal(pack.status, 0, pack.stderr);
    const artifacts: PackedArtifact[] = JSON.parse(pack.stdout);
    const [artifact] = artifacts;
    assert.ok(artifact);
    const contents = new Set(artifact.files.map((file) => file.path));
    const unpack = spawnSync('tar', ['-xzf', join(directory, artifact.filename), '-C', directory], { encoding: 'utf8' });
    assert.equal(unpack.status, 0, unpack.stderr);
    const packageRoot = realpathSync(join(directory, 'package'));
    const manifest: PackageManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(manifest.exports), ['.', './plugins/style', './plugins/policy']);
    assert.deepEqual(manifest.peerDependencies, { oxlint: '1.87.0' });
    assert.equal(manifest.engines.node, '^22.13.0 || >=24.0.0');
    assert.equal(manifest.dependencies.oxlint, undefined);
    assert.equal(manifest.dependencies.typescript, undefined);
    assert.equal(manifest.dependencies['typescript-eslint'], undefined);
    assert.equal(manifest.dependencies['@eslint-community/eslint-plugin-eslint-comments'], undefined);
    assert.equal(manifest.dependencies['oxlint-tsgolint'], '7.0.2003');
    assert.equal(manifest.dependencies['@stylistic/eslint-plugin'], '5.10.0');
    assert.equal(manifest.dependencies.eslint, '10.12.0');
    assert.equal(manifest.dependencies['oxc-parser'], '0.153.0');
    assert.equal(manifest.dependencies['type-fest'], '5.10.0', 'Public resolver declarations need type-fest without dev dependencies');
    assert.equal(manifest.dependencies['@types/picomatch'], '4.0.3', 'Public provider declarations need picomatch types without dev dependencies');
    assert.equal(manifest.devDependencies['type-fest'], undefined);
    assert.equal(manifest.devDependencies['@types/picomatch'], undefined);
    for (const [name, version] of Object.entries({ 'eslint-import-resolver-typescript': '4.4.5', 'eslint-plugin-import-x': '4.17.1', 'eslint-plugin-n': '18.4.1', 'eslint-plugin-unicorn': '77.0.0', globals: '17.13.0', tinyglobby: '0.2.17', 'unrs-resolver': '1.12.2' })) {
      assert.equal(manifest.dependencies[name], version);
      assert.equal(manifest.devDependencies[name], undefined);
    }
    assert.equal(manifest.bin, undefined);
    for (const prefix of ['src/', 'test/', 'scripts/']) {
      assert.equal([...contents].some((path) => path.startsWith(prefix)), false, `Development files leaked from ${prefix}`);
    }
    for (const path of ['README.md', 'LICENSE', 'CHANGELOG.md', 'GLOSSARY.md', 'docs/oxlint-configuration.md', 'docs/support.md', 'examples/basic-config.mjs', 'examples/README.md']) {
      assert.ok(contents.has(path), `Missing consumer asset ${path}`);
    }
    for (const entry of Object.values(manifest.exports)) {
      for (const target of Object.values(entry)) {
        assert.ok(contents.has(target.slice(2)), `Missing export target ${target}`);
      }
    }
    assert.ok(contents.has('dist/options.d.ts'));
    const compiledAssets = ['index', 'options', 'patterns', 'resolver', 'rules', 'export-parser', 'export-graph', 'plugins/style', 'plugins/policy']
      .flatMap((name) => [`dist/${name}.js`, `dist/${name}.d.ts`]).sort();
    assert.deepEqual([...contents].filter((path) => path.startsWith('dist/')).sort(), compiledAssets, 'Only configuration and plugin assets are published');
    const rootExport = manifest.exports['.'];
    assert.ok(rootExport);
    const publicModule: typeof PublicModule = await import(pathToFileURL(join(packageRoot, rootExport.import)).href);
    assert.deepEqual(Object.keys(publicModule).sort(), ['createConfig', 'default']);
    assert.deepEqual(publicModule.default, publicModule.createConfig());
    const config = publicModule.createConfig({ projectRoot: repository });
    assert.ok(config.jsPlugins);
    assert.ok(config.rules);
    assert.ok(config.settings);
    assert.deepEqual(config.jsPlugins.map((plugin) => {
      assert.equal(typeof plugin, 'object');
      assert.ok(typeof plugin !== 'string');
      return plugin.name;
    }), ['style', 'policy']);
    await Promise.all(config.jsPlugins.map(async (plugin) => {
      assert.ok(typeof plugin !== 'string');
      const entry = manifest.exports[`./plugins/${plugin.name}`];
      assert.ok(entry);
      assert.equal(plugin.specifier, join(packageRoot, entry.import));
      assert.ok(existsSync(plugin.specifier));
      const { default: bundled } = await import(pathToFileURL(plugin.specifier).href);
      if (plugin.name === 'policy') {
        assert.equal(typeof bundled.rules.export.create, 'function');
        assert.equal(config.rules?.['policy/export'], 'error');
        assert.deepEqual(config.settings?.['import-x/extensions'], ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts']);
      }
      for (const id of Object.keys(config.rules ?? {}).filter((name) => name.startsWith(`${plugin.name}/`))) {
        assert.equal(typeof bundled.rules[id.slice(plugin.name.length + 1)]?.create, 'function', `Missing rule ${id}`);
      }
    }));
    // Compile the public API fixture against packed targets, with full declaration checking.
    const paths = Object.fromEntries(Object.entries(manifest.exports).map(([subpath, entry]) => [
      subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`,
      [join(packageRoot, entry.types)],
    ]));
    const tsconfig = join(directory, 'tsconfig.json');
    writeFileSync(tsconfig, JSON.stringify({
      compilerOptions: {
        strict: true,
        noUncheckedIndexedAccess: true,
        module: 'NodeNext',
        target: 'ES2024',
        noEmit: true,
        skipLibCheck: false,
        types: ['node'],
        typeRoots: [join(repository, 'node_modules/@types')],
        paths,
      },
      files: [join(repository, 'test/types.ts')],
    }));
    const declarations = spawnSync(process.execPath, [join(repository, 'node_modules/typescript/bin/tsc'), '-p', tsconfig], { cwd: repository, encoding: 'utf8' });
    assert.equal(declarations.status, 0, `${declarations.stdout}${declarations.stderr}`);
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
