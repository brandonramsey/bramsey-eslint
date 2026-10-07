import { fileURLToPath } from 'node:url';

import { createConfig } from './src/index.js';

export default createConfig({
  projectRoot: fileURLToPath(new URL('.', import.meta.url)),
  ignores: ['test/fixtures/**', 'examples/rules/**', '.consumer/**', '.agents/**', '.codex/**'],
});
