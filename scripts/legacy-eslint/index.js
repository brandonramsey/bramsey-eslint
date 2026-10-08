import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative } from 'node:path';

import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import stylistic from '@stylistic/eslint-plugin';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import nodePlugin from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import { globSync } from 'tinyglobby';
import tseslint from 'typescript-eslint';

import { coreRules, declarationRules, importRules, nodeRules, testRules, tsSyntaxRules, typedRules, unicornRules } from './rules.js';
import { styleRules } from './style-rules.js';

export const plugins = {
  '@typescript-eslint': tseslint.plugin,
  '@stylistic': stylistic,
  'import-x': importX,
  n: nodePlugin,
  unicorn,
  '@eslint-community/eslint-comments': eslintComments,
};

const allFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
const tsFiles = ['**/*.{ts,tsx,mts,cts}'];
const declarations = ['**/*.d.{ts,mts,cts}'];
const standardTests = ['**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}', '**/__tests__/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];
const generated = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**'];

function moduleLanguage(sourceType) {
  return {
    sourceType,
    globals: sourceType === 'commonjs'
      ? globals.node
      : {
          ...globals.nodeBuiltin,
          require: 'off',
          module: 'off',
          exports: 'off',
          __dirname: 'off',
          __filename: 'off',
        },
  };
}

function packageModuleConfigs(projectRoot) {
  const manifests = globSync(['package.json', '**/package.json'], { cwd: projectRoot, ignore: generated, absolute: true });
  // Apply parents before children so a workspace package can select its own mode.
  return manifests.sort((left, right) => left.split('/').length - right.split('/').length || left.localeCompare(right))
    .map((manifest) => {
      const prefix = relative(projectRoot, dirname(manifest)).replaceAll('\\', '/');
      const packageJson = JSON.parse(readFileSync(manifest, 'utf8'));
      return {
        name: `@brandonramsey/eslint/module:${prefix || '.'}`,
        files: [`${prefix ? `${prefix}/` : ''}**/*.{js,jsx,ts,tsx}`],
        languageOptions: moduleLanguage(packageJson.type === 'module' ? 'module' : 'commonjs'),
      };
    });
}

function importResolver(projectRoot, options) {
  const { project = '**/tsconfig.json', ...settings } = options;
  const projects = globSync(project, { cwd: projectRoot, ignore: generated, absolute: true });
  const resolvers = projects.map((configFile) => ({
    directory: dirname(configFile),
    // One resolver per project avoids cross-project caches and respects the ESLint cwd.
    resolver: createTypeScriptImportResolver({ alwaysTryTypes: true, ...settings, project: configFile }),
  }));
  const fallback = createTypeScriptImportResolver({ alwaysTryTypes: true, ...settings });
  return {
    interfaceVersion: 3,
    name: '@brandonramsey/eslint/typescript-resolver',
    resolve(source, file) {
      const selectedProject = resolvers.filter(({ directory }) => {
        const path = relative(directory, file);
        return !path.startsWith('..') && !isAbsolute(path);
      }).sort((left, right) => right.directory.length - left.directory.length)[0];
      return (selectedProject?.resolver ?? fallback).resolve(source, file);
    },
  };
}

function normalizeOptions({
  projectRoot = process.cwd(),
  syntaxOnlyFiles = [],
  testFiles = [],
  tests = true,
  ignores = [],
  resolverOptions = {},
  commonjsFiles = [],
  moduleFiles = [],
} = {}) {
  return { projectRoot, syntaxOnlyFiles, testFiles, tests, ignores, resolverOptions, commonjsFiles, moduleFiles };
}

/** Build a flat configuration rooted at the consuming project. */
export function createConfig(options) {
  const { projectRoot, syntaxOnlyFiles, testFiles, tests, ignores, resolverOptions, commonjsFiles, moduleFiles } = normalizeOptions(options);
  if (!isAbsolute(projectRoot)) {
    throw new TypeError('projectRoot must be an absolute path.');
  }
  const resolver = importResolver(projectRoot, resolverOptions);
  const syntaxExceptions = [...declarations, ...syntaxOnlyFiles];
  const config = [
    { name: '@brandonramsey/eslint/ignores', ignores: [...generated, ...ignores] },
    {
      name: '@brandonramsey/eslint/base',
      files: allFiles,
      plugins,
      languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        ...moduleLanguage('module'),
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      settings: {
        n: { version: '>=24.0.0' },
        'import-x/resolver-next': [resolver],
        'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx', '.mts', '.cts'] },
      },
      rules: {
        ...coreRules,
        ...styleRules,
        ...importRules,
        ...nodeRules,
        ...unicornRules,
        '@eslint-community/eslint-comments/require-description': ['error', { ignore: ['eslint-enable', 'eslint', 'eslint-env', 'global', 'exported'] }],
      },
    },
    ...packageModuleConfigs(projectRoot),
    { name: '@brandonramsey/eslint/commonjs', files: ['**/*.{cjs,cts}', ...commonjsFiles], languageOptions: moduleLanguage('commonjs') },
    { name: '@brandonramsey/eslint/esm', files: ['**/*.{mjs,mts}', ...moduleFiles], languageOptions: moduleLanguage('module') },
    { name: '@brandonramsey/eslint/typescript', files: tsFiles, rules: tsSyntaxRules },
    {
      name: '@brandonramsey/eslint/typed',
      files: tsFiles,
      ignores: syntaxExceptions,
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: projectRoot } },
      rules: typedRules,
    },
    {
      name: '@brandonramsey/eslint/syntax-only',
      files: syntaxExceptions,
      languageOptions: { parserOptions: { project: false, projectService: false } },
    },
    { name: '@brandonramsey/eslint/declarations', files: declarations, rules: declarationRules },
  ];
  if (tests) {
    config.push({ name: '@brandonramsey/eslint/tests', files: [...standardTests, ...testFiles], ignores: declarations, rules: testRules });
  }
  return config;
}

export default createConfig();
