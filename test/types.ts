import config, { createConfig } from '@brandonramsey/eslint';

import type { ConfigOptions, OxlintConfig, OxlintOverride } from '@brandonramsey/eslint';
import type style from '@brandonramsey/eslint/plugins/style';

const override: OxlintOverride = { files: ['fixtures/**'], rules: { 'typescript/no-explicit-any': 'off' } };
const options: ConfigOptions = {
  projectRoot: import.meta.dirname,
  syntaxOnlyFiles: ['tools/**/*.ts'],
  testFiles: ['fixtures/**'],
  tests: false,
  commonjsFiles: ['legacy/**/*.js'],
  moduleFiles: ['modern/**/*.ts'],
  overrides: [override],
};

export const configurations: OxlintConfig[] = [config, createConfig(options)];
export type StylePlugin = typeof style;
