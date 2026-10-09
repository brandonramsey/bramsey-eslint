import config, { createConfig } from '@brandonramsey/lint';

import type { ConfigOptions, OxlintConfig, OxlintOverride, ResolverOptions } from '@brandonramsey/lint';
import type policy from '@brandonramsey/lint/plugins/policy';
import type style from '@brandonramsey/lint/plugins/style';

const override: OxlintOverride = { files: ['fixtures/**'], rules: { 'typescript/no-explicit-any': 'off' } };
const options: ConfigOptions = {
  projectRoot: import.meta.dirname,
  syntaxOnlyFiles: ['tools/**/*.ts'],
  testFiles: ['fixtures/**'],
  tests: false,
  commonjsFiles: ['legacy/**/*.js'],
  moduleFiles: ['modern/**/*.ts'],
  resolverOptions: { project: ['packages/*/tsconfig.app.json'], extensions: ['.ts', '.custom'], alwaysTryTypes: false },
  overrides: [override],
};

export const configurations: OxlintConfig[] = [config, createConfig(options)];
export type StylePlugin = typeof style;
export type PolicyPlugin = typeof policy;

export const resolver: ResolverOptions = { conditionNames: ['types', 'node'], extensionAlias: { '.js': ['.ts', '.js'] } };
// @ts-expect-error -- The package controls project selection; native tsconfig auto-selection is unsupported.
export const automaticResolver: ResolverOptions = { tsconfig: 'auto' };
// @ts-expect-error -- Null options are not supported.
export const invalidOptions: ConfigOptions = { resolverOptions: null };
