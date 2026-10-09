import { createConfig } from '@brandonramsey/eslint';

export default createConfig({
  ignores: ['test/fixtures/**', 'docs/research/**', 'examples/rules/**', 'scripts/legacy-eslint/**', 'scripts/generate-reference.js', '.tooling/**', 'oxlint.config.js', '.agents/**', '.codex/**'],
});
