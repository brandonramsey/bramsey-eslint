import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

import { defaultConditionNames, defaultExtensionAlias, defaultExtensions, defaultMainFields, resolve as resolveImport } from 'eslint-import-resolver-typescript';
import { globSync } from 'tinyglobby';
import { ResolverFactory } from 'unrs-resolver';

import { generated } from './patterns.js';

import type { ResolverOptions } from './options.js';

export function resolverOptions(projectRoot: string, options: ResolverOptions = {}): ResolverOptions {
  const patterns = typeof options.project === 'string' ? [options.project] : options.project ?? ['**/tsconfig.json'];
  const exclusions = patterns.filter((pattern) => pattern.startsWith('!'));
  const project = patterns.filter((pattern) => !pattern.startsWith('!')).flatMap((pattern) => {
    const matches = globSync([pattern, ...exclusions], {
      cwd: projectRoot,
      absolute: true,
      expandDirectories: false,
      ignore: generated,
    });
    if (options.project !== undefined && matches.length === 0) {
      throw new TypeError(`No resolver projects match resolverOptions.project pattern: ${pattern}.`);
    }
    return matches;
  });
  if (options.project !== undefined && project.length === 0) {
    throw new TypeError('No resolver projects match resolverOptions.project.');
  }
  return { alwaysTryTypes: true, ...structuredClone(options), project: [...new Set(project.map((path) => realpathSync(path)))].sort() };
}

/** Each bridge context owns its resolvers; never reuse a provider's global cache. */
export function createProjectResolver(projectRoot: string, options: ResolverOptions): {
  interfaceVersion: number;
  name: string;
  resolve: (source: string, file: string) => ReturnType<typeof resolveImport>;
} {
  const projects = typeof options.project === 'string' ? [options.project] : options.project ?? [];
  const ordered = projects.map((project) => ({ project, directory: dirname(project) }))
    .sort((left, right) => left.directory.length === right.directory.length ? left.project.localeCompare(right.project) : right.directory.length - left.directory.length);
  const resolvers = new Map<string | undefined, ResolverFactory>();
  return {
    interfaceVersion: 3,
    name: '@brandonramsey/eslint/nearest-project',
    resolve(source, file) {
      const canonicalFile = realpathSync(resolve(projectRoot, file));
      const selected = ordered.find(({ directory }) => {
        const path = relative(directory, canonicalFile);
        return path !== '..' && !path.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(path);
      });
      let resolver = resolvers.get(selected?.project);
      if (resolver === undefined) {
        resolver = new ResolverFactory({
          conditionNames: defaultConditionNames,
          extensions: defaultExtensions,
          extensionAlias: defaultExtensionAlias,
          mainFields: defaultMainFields,
          ...options,
          // Omitting tsconfig is essential: project: [] otherwise discovers cwd aliases.
          tsconfig: selected === undefined ? undefined : { configFile: selected.project, references: 'auto' },
        });
        resolvers.set(selected?.project, resolver);
      }
      return resolveImport(source, canonicalFile, options, resolver);
    },
  };
}
