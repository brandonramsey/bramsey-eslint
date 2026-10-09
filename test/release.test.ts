import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const guard = fileURLToPath(new URL('../scripts/check-release.js', import.meta.url));

await test('the release CLI accepts the exact package version tag', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint-release-'));
  try {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ version: '1.2.3' }));
    const result = spawnSync(process.execPath, [guard, 'v1.2.3'], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

await test('the release CLI rejects mismatched, unprefixed and missing tags', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lint-release-'));
  try {
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ version: '1.2.3' }));
    for (const args of [['v1.2.4'], ['1.2.3'], []]) {
      const result = spawnSync(process.execPath, [guard, ...args], { cwd: directory, encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Tag must match package version: expected v1\.2\.3/);
    }
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
