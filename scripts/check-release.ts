import { readFileSync } from 'node:fs';

const manifest: unknown = JSON.parse(readFileSync('package.json', 'utf8'));
if (typeof manifest !== 'object' || manifest === null || !('version' in manifest) || typeof manifest.version !== 'string') {
  throw new Error('package.json must contain a version string');
}
const expected = `v${manifest.version}`;
if (process.argv[2] !== expected) {
  throw new Error(`Tag must match package version: expected ${expected}`);
}
console.log(`Release tag matches package version: ${expected}`);
