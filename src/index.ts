import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import globals from 'globals';
import { globSync } from 'tinyglobby';

import { validateOptions } from './options.js';
import { generated } from './patterns.js';
import { resolverOptions } from './resolver.js';
import { baseRules, declarationRules, syntaxRules, testRules, typedRules } from './rules.js';

import type { ConfigOptions } from './options.js';
import type { OxlintConfig, OxlintGlobals, OxlintOverride } from 'oxlint';

export type { OxlintConfig, OxlintOverride } from 'oxlint';

export type { ConfigOptions, ResolverOptions } from './options.js';

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}'];
const declarations = ['**/*.d.{ts,mts,cts}'];
const standardTests = ['**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}', '**/__tests__/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];

function moduleGlobals(commonjs: boolean): OxlintGlobals {
  if (commonjs) {
    return Object.fromEntries(Object.keys(globals.node).map((name) => [name, 'readonly']));
  }
  return { ...Object.fromEntries(Object.keys(globals.nodeBuiltin).map((name) => [name, 'readonly' as const])), require: 'off', module: 'off', exports: 'off', __dirname: 'off', __filename: 'off' };
}

function packageOverrides(projectRoot: string): OxlintOverride[] {
  const manifests = globSync(['package.json', '**/package.json'], { cwd: projectRoot, ignore: generated, absolute: true });
  // Parents precede workspace children, including package boundaries with no type.
  return manifests.sort((left, right) => left.split('/').length === right.split('/').length ? left.localeCompare(right) : left.split('/').length - right.split('/').length)
    .map((manifest) => {
      const prefix = relative(projectRoot, dirname(realpathSync(manifest))).replaceAll('\\', '/');
      if (prefix === '..' || prefix.startsWith('../') || isAbsolute(prefix)) {
        throw new TypeError(`Package manifest resolves outside projectRoot: ${manifest}.`);
      }
      const metadata: unknown = JSON.parse(readFileSync(manifest, 'utf8'));
      if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new TypeError(`Package manifest must be an object: ${manifest}.`);
      }
      return { files: [`${prefix !== '' ? `${prefix}/` : ''}**/*.{js,jsx,ts,tsx}`], globals: moduleGlobals(!('type' in metadata && metadata.type === 'module')) };
    });
}

function policyOverrides(projectRoot: string, commonjsFiles: string[], moduleFiles: string[]): OxlintOverride[] {
  const overrides: OxlintOverride[] = [...packageOverrides(projectRoot)];
  for (const [files, commonjs] of [[commonjsFiles, true], [moduleFiles, false]] as const) {
    if (files.length > 0) {
      overrides.push({ files: [...files], globals: moduleGlobals(commonjs) });
    }
  }
  return overrides;
}

function canonicalRoot(inputRoot: unknown = process.cwd()): string {
  if (typeof inputRoot !== 'string' || !isAbsolute(inputRoot)) {
    throw new TypeError('projectRoot must be an absolute path.');
  }
  return realpathSync(inputRoot);
}

/** Build native Oxlint policy. Align cwd/config directory/file paths with projectRoot. */
export function createConfig(options: ConfigOptions = {}): OxlintConfig {
  validateOptions(options);
  const projectRoot = canonicalRoot(options.projectRoot);
  const overrides = policyOverrides(projectRoot, options.commonjsFiles ?? [], options.moduleFiles ?? []);
  overrides.push(
    { files: ['**/*.{cjs,cts}'], globals: moduleGlobals(true) },
    { files: ['**/*.{mjs,mts}'], globals: moduleGlobals(false) },
    { files: [...typescriptFiles], rules: structuredClone(syntaxRules) },
    { files: [...typescriptFiles], excludeFiles: [...declarations, ...options.syntaxOnlyFiles ?? []], rules: structuredClone(typedRules) },
    { files: [...declarations], rules: structuredClone(declarationRules) },
  );
  if (options.tests !== false) {
    overrides.push({ files: [...standardTests, ...options.testFiles ?? []], excludeFiles: [...declarations], rules: structuredClone(testRules) });
  }
  // Test relaxations precede syntax-only disabling; consumers have final precedence.
  overrides.push({ files: [...declarations, ...options.syntaxOnlyFiles ?? []], rules: Object.fromEntries(Object.keys(typedRules).filter((id) => id.startsWith('typescript/')).map((id) => [id, 'off'])) });
  overrides.push(...structuredClone(options.overrides ?? []));
  return {
    categories: { correctness: 'off' },
    plugins: ['typescript', 'import', 'node', 'unicorn'],
    jsPlugins: ['style', 'policy'].map((name) => ({ name, specifier: realpathSync(fileURLToPath(new URL(`./plugins/${name}.js`, import.meta.url))) })),
    env: { builtin: true },
    globals: moduleGlobals(false),
    options: { typeAware: true, reportUnusedDisableDirectives: 'error' },
    settings: {
      policy: { projectRoot, resolverOptions: resolverOptions(projectRoot, options.resolverOptions) },
      n: { version: '>=24.0.0' },
      'import-x/extensions': ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'],
    },
    rules: structuredClone(baseRules),
    ignorePatterns: [...generated, ...options.ignores ?? []],
    overrides,
  };
}

export default createConfig();
