import config, { createConfig } from '../src/index.js';

import type { ConfigOptions } from '../src/index.js';

const options: ConfigOptions = {
  projectRoot: '/project',
  syntaxOnlyFiles: ['eslint.config.ts'],
  testFiles: ['fixtures/**'],
  tests: false,
  resolverOptions: { project: ['packages/*/tsconfig.json'] },
  commonjsFiles: ['legacy/**/*.js'],
  moduleFiles: ['modern/**/*.ts'],
};

export const configurations = [config, createConfig(options)];
