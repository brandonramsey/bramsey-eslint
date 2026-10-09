import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repository = fileURLToPath(new URL('../', import.meta.url));

test('packed public modules, declarations, dependencies and plugin specifiers are self-contained', async () => {
  // Unpack inside node_modules so bundled providers resolve normally; install nothing.
  const directory = mkdtempSync(join(repository, 'node_modules/.lint-package-contract-'));
  try {
    const pack = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory, '--cache', join(directory, 'cache')], { cwd: repository, encoding: 'utf8' });
    assert.equal(pack.status, 0, pack.stderr);
    const [artifact] = JSON.parse(pack.stdout);
    const contents = new Set(artifact.files.map((file) => file.path));
    const unpack = spawnSync('tar', ['-xzf', join(directory, artifact.filename), '-C', directory], { encoding: 'utf8' });
    assert.equal(unpack.status, 0, unpack.stderr);
    const packageRoot = realpathSync(join(directory, 'package'));
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(manifest.exports), ['.', './plugins/style', './plugins/policy']);
    assert.deepEqual(manifest.peerDependencies, { oxlint: '1.87.0' });
    assert.equal(manifest.dependencies['oxlint-tsgolint'], '7.0.2003');
    assert.equal(manifest.dependencies['@stylistic/eslint-plugin'], '5.10.0');
    assert.equal(manifest.dependencies.eslint, '10.12.0');
    for (const [name, version] of Object.entries({ 'eslint-import-resolver-typescript': '4.4.5', 'eslint-plugin-import-x': '4.17.1', 'eslint-plugin-n': '18.4.1', 'eslint-plugin-unicorn': '77.0.0', 'unrs-resolver': '1.12.2' })) {
      assert.equal(manifest.dependencies[name], version);
      assert.equal(manifest.devDependencies[name], undefined);
    }
    assert.equal(manifest.bin, undefined);
    assert.equal([...contents].some((path) => path.startsWith('src/')), false);
    for (const entry of Object.values(manifest.exports)) {
      for (const target of Object.values(entry)) {
        assert.ok(contents.has(target.slice(2)), `Missing export target ${target}`);
      }
    }
    assert.ok(contents.has('dist/options.d.ts'));
    const publicModule = await import(pathToFileURL(join(packageRoot, 'dist/index.js')).href);
    assert.deepEqual(Object.keys(publicModule).sort(), ['createConfig', 'default']);
    const config = publicModule.createConfig({ projectRoot: repository });
    assert.deepEqual(config.jsPlugins.map((plugin) => plugin.name), ['style', 'policy']);
    await Promise.all(config.jsPlugins.map(async (plugin) => {
      assert.ok(plugin.specifier.startsWith(`${packageRoot}/`));
      assert.ok(existsSync(plugin.specifier));
      const { default: bundled } = await import(pathToFileURL(plugin.specifier).href);
      for (const id of Object.keys(config.rules).filter((name) => name.startsWith(`${plugin.name}/`))) {
        assert.equal(typeof bundled.rules[id.slice(plugin.name.length + 1)]?.create, 'function', `Missing rule ${id}`);
      }
    }));
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
