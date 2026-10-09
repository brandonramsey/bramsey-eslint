import { spawnSync } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import type { Rule } from 'eslint';

const compiler = join(dirname(createRequire(import.meta.url).resolve('typescript-coverage/package.json')), 'bin/tsc');
type Project = { files: Set<string>; references: string[] };

function inspect(projectRoot: string, compilerArguments: string[]): string {
  const result = spawnSync(process.execPath, [compiler, ...compilerArguments], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error !== undefined || result.status !== 0) {
    throw new Error(`Cannot inspect TypeScript coverage (${compilerArguments.at(-1) ?? projectRoot}): ${result.stdout}${result.stderr}`, { cause: result.error });
  }
  return result.stdout;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function configFiles(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((file: unknown) => typeof file === 'string')) {
    throw new TypeError('Invalid files in TypeScript coverage metadata.');
  }
  return value;
}

function configReferences(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new TypeError('Invalid references in TypeScript coverage metadata.');
  }
  return value.map((reference: unknown) => {
    if (!object(reference) || typeof reference.path !== 'string') {
      throw new TypeError('Invalid reference path in TypeScript coverage metadata.');
    }
    return reference.path;
  });
}

function readProject(projectRoot: string, configFile: string): Project {
  // showConfig can recover malformed JSON silently; validate before expansion.
  // Dry builds inspect configuration/references without type checking or emitting.
  inspect(projectRoot, ['--build', '--dry', configFile]);
  const metadata: unknown = JSON.parse(inspect(projectRoot, ['--showConfig', '--project', configFile]));
  if (!object(metadata)) {
    throw new TypeError(`Invalid TypeScript coverage metadata: ${configFile}.`);
  }
  const directory = dirname(configFile);
  return {
    // Root inputs only: importing an excluded file doesn't establish membership.
    files: new Set(configFiles(metadata.files).map((file) => realpathSync(resolve(directory, file)))),
    references: configReferences(metadata.references).map((reference) => {
      const target = resolve(directory, reference);
      return realpathSync(target.endsWith('.json') ? target : join(target, 'tsconfig.json'));
    }),
  };
}

function exists(file: string): boolean {
  try {
    return statSync(file).isFile();
  }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function nearestConfig(directory: string): string | undefined {
  for (let current = directory; ; current = dirname(current)) {
    for (const name of ['tsconfig.json', 'jsconfig.json']) {
      const file = join(current, name);
      if (exists(file)) {
        return file;
      }
    }
    const parent = dirname(current);
    if (parent === current || current.endsWith(`${process.platform === 'win32' ? '\\' : '/'}node_modules`)) {
      return undefined;
    }
  }
}

/** Each file context owns its metadata: no shared roots or stale lint-run snapshots. */
function configuredProject(projectRoot: string, file: string): string | undefined {
  const visited = new Set<string>();
  let candidate = nearestConfig(dirname(file));
  while (candidate !== undefined) {
    const pending = [candidate];
    // Array iterators include appended references, preserving breadth-first order.
    for (const entry of pending) {
      const configFile = realpathSync(entry);
      if (visited.has(configFile)) {
        continue;
      }
      visited.add(configFile);
      const project = readProject(projectRoot, configFile);
      if (project.files.has(file)) {
        return configFile;
      }
      pending.push(...project.references);
    }
    // Pinned tsgolint has no fallback unless it found root membership, which
    // returns immediately above. disableSolutionSearching alone cannot stop us.
    const directory = dirname(candidate);
    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    candidate = nearestConfig(parent);
  }
  return undefined;
}

function policyRoot(settings: unknown): string {
  if (!object(settings) || typeof settings.projectRoot !== 'string' || !isAbsolute(settings.projectRoot)) {
    throw new TypeError('The inferred-coverage rule requires createConfig projectRoot settings.');
  }
  return realpathSync(settings.projectRoot);
}

export const inferredCoverageRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Warn when typed linting uses inferred compiler settings.' },
    schema: [],
    messages: {
      inferred: 'This file has no configured TypeScript root membership. Typed checks continue with inferred compiler settings; include it in a reachable tsconfig or mark it syntax-only.',
    },
  },
  create(context) {
    const projectRoot = policyRoot(context.settings.policy);
    return {
      Program(node) {
        const file = context.physicalFilename;
        if (!/\.(?:[cm]?ts|tsx)$/u.test(file) || /\.d\.[cm]?ts$/u.test(file)) {
          return;
        }
        if (configuredProject(projectRoot, realpathSync(resolve(projectRoot, file))) === undefined) {
          context.report({ node, messageId: 'inferred' });
        }
      },
    };
  },
};
