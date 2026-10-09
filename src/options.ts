import { ResolverFactory } from 'unrs-resolver';

import type { OxlintOverride } from 'oxlint';
import type { NapiResolveOptions } from 'unrs-resolver';

/** Project discovery is package-owned; native tsconfig overrides are unsupported. */
export type ResolverOptions = Omit<NapiResolveOptions, 'tsconfig'> & {
  project?: string | string[];
  alwaysTryTypes?: boolean;
  bun?: boolean;
  noWarnOnMultipleProjects?: boolean;
};

export type ConfigOptions = {
  /** Absolute project root, canonicalized before discovery; defaults to cwd. */
  projectRoot?: string;
  /** Disable typed rules for these explicit syntax-only exceptions. */
  syntaxOnlyFiles?: string[];
  testFiles?: string[];
  /** Apply the relaxed test profile, including testFiles; defaults to true. */
  tests?: boolean;
  /** Extend generated/build/dependency exclusions. */
  ignores?: string[];
  /** Resolver project patterns relative to projectRoot, plus provider options. */
  resolverOptions?: ResolverOptions;
  /** Select CommonJS globals/policy for ambiguous extensions, not parser mode. */
  commonjsFiles?: string[];
  /** Select module globals/policy; wins overlaps with commonjsFiles. */
  moduleFiles?: string[];
  /** Native overrides appended after every package policy stage. */
  overrides?: OxlintOverride[];
};

const optionKeys = new Set(['projectRoot', 'syntaxOnlyFiles', 'testFiles', 'tests', 'ignores', 'resolverOptions', 'commonjsFiles', 'moduleFiles', 'overrides']);
const overrideKeys = new Set(['files', 'excludeFiles', 'rules', 'globals', 'env', 'plugins', 'jsPlugins']);
const resolverKeys = new Set(['project', 'alwaysTryTypes', 'bun', 'noWarnOnMultipleProjects', 'alias', 'aliasFields', 'conditionNames', 'enforceExtension', 'exportsFields', 'importsFields', 'extensionAlias', 'extensions', 'fallback', 'fullySpecified', 'mainFields', 'mainFiles', 'modules', 'resolveToContext', 'preferRelative', 'preferAbsolute', 'restrictions', 'roots', 'symlinks', 'nodePath', 'builtinModules', 'moduleType', 'allowPackageExportsInDirectoryResolve']);

function serializableResolverEntry(_key: string, entry: unknown): unknown {
  if (typeof entry === 'function' || typeof entry === 'symbol' || typeof entry === 'bigint' || (typeof entry === 'number' && !Number.isFinite(entry))) {
    throw new TypeError('Resolver options must be serializable.');
  }
  return entry;
}

function resolverProject(value: unknown): void {
  if (value === undefined) {
    return;
  }
  patterns(typeof value === 'string' ? [value] : value, 'resolverOptions.project');
  if (Array.isArray(value) && value.length === 0) {
    throw new TypeError('resolverOptions.project must not be empty.');
  }
}

function resolver(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!object(value)) {
    throw new TypeError('resolverOptions must be an object.');
  }
  knownFields(value, resolverKeys, 'resolverOptions');
  resolverProject(value.project);
  for (const key of ['alwaysTryTypes', 'bun', 'noWarnOnMultipleProjects']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') {
      throw new TypeError(`resolverOptions.${key} must be a boolean.`);
    }
  }
  // Native option validation covers the provider's nested mappings and flags.
  try {
    JSON.stringify(value, serializableResolverEntry);
    new ResolverFactory(value);
  }
  catch (error) {
    throw new TypeError('Invalid resolverOptions.', { cause: error });
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function patterns(value: unknown, name: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((pattern: unknown) => typeof pattern !== 'string' || pattern.length === 0)) {
    throw new TypeError(`${name} must be an array of nonempty file patterns.`);
  }
}

function knownFields(value: Record<string, unknown>, keys: Set<string>, name: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) {
      throw new TypeError(`Unsupported ${name} field: ${key}.`);
    }
  }
}

function jsPlugin(value: unknown): void {
  if (typeof value === 'string' && value.length > 0) {
    return;
  }
  if (!object(value) || typeof value.specifier !== 'string' || value.specifier.length === 0 || (value.name !== undefined && typeof value.name !== 'string')) {
    throw new TypeError('Each JS plugin needs a nonempty specifier and an optional string name.');
  }
  knownFields(value, new Set(['name', 'specifier']), 'JS plugin');
}

function jsPlugins(value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new TypeError('override.jsPlugins must be an array or null.');
  }
  value.forEach((entry: unknown) => {
    jsPlugin(entry);
  });
}

function override(value: unknown): void {
  if (!object(value)) {
    throw new TypeError('Each override must be a native Oxlint override object.');
  }
  knownFields(value, overrideKeys, 'override');
  for (const key of ['rules', 'globals', 'env']) {
    if (value[key] !== undefined && !object(value[key])) {
      throw new TypeError(`override.${key} must be an object.`);
    }
  }
  patterns(value.files, 'override.files');
  for (const key of ['excludeFiles', 'plugins']) {
    if (value[key] !== undefined) {
      patterns(value[key], `override.${key}`);
    }
  }
  jsPlugins(value.jsPlugins);
}

function overrides(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new TypeError('overrides must be an array.');
  }
  value.forEach((entry: unknown) => {
    override(entry);
  });
}

export function validateOptions(value: unknown): asserts value is ConfigOptions {
  if (!object(value)) {
    throw new TypeError('Config options must be an object.');
  }
  knownFields(value, optionKeys, 'config option');
  for (const key of ['syntaxOnlyFiles', 'testFiles', 'ignores', 'commonjsFiles', 'moduleFiles']) {
    if (value[key] !== undefined) {
      patterns(value[key], key);
    }
  }
  if (value.tests !== undefined && typeof value.tests !== 'boolean') {
    throw new TypeError('tests must be a boolean.');
  }
  overrides(value.overrides);
  resolver(value.resolverOptions);
}
