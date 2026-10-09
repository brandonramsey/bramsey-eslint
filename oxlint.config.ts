import { createConfig } from '@brandonramsey/lint';

export default createConfig({
  ignores: ['test/fixtures/**', 'docs/research/**', 'examples/rules/**', 'examples/complete-config.mjs', 'scripts/legacy-eslint/**', '.tooling/**', 'oxlint.config.js', '.agents/**', '.codex/**'],
});
