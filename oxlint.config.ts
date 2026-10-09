import { createConfig } from '@brandonramsey/eslint';

export default createConfig({
  ignores: ['test/fixtures/**', 'docs/research/**', 'examples/rules/**', 'examples/complete-config.mjs', 'scripts/legacy-eslint/**', '.tooling/**', 'oxlint.config.js', '.agents/**', '.codex/**'],
});
