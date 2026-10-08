import { fileURLToPath } from 'node:url';

import { createConfig } from './scripts/legacy-eslint/index.js';

export default createConfig({
  projectRoot: fileURLToPath(new URL('.', import.meta.url)),
  ignores: ['test/fixtures/**', 'docs/research/**', 'examples/rules/**', '.consumer/**', '.agents/**', '.codex/**'],
});
