import { readFileSync, realpathSync } from 'node:fs';

import { ExportMap } from 'eslint-plugin-import-x/utils';

import { createExportParser } from './export-parser.js';

import type { createProjectResolver } from './resolver.js';
import type { Rule } from 'eslint';
import type { Program } from 'oxc-parser';

const ambiguous = Symbol('ambiguous export');
type Binding = string | typeof ambiguous | null;
type Module = { map: ExportMap; program: Program };
type Traversal = { seen: Set<string>; depth: number };
type Branch = { node: Rule.Node; module: Module | null; names: Set<string> };

function nameOf(node: { type: string; name?: string; value?: unknown } | null | undefined): string | undefined {
  return node?.name ?? (typeof node?.value === 'string' ? node.value : undefined);
}

function identity(path: string, name: string): string {
  return JSON.stringify([path, name]);
}

function namespaceBinding(module: Module | null): Binding {
  return module === null ? null : identity(module.map.path, '*namespace*');
}

function localName(program: Program, name: string): string {
  for (const node of program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      const specifier = node.specifiers.find((item) => nameOf(item.exported) === name);
      if (specifier !== undefined) {
        return nameOf(specifier.local) ?? name;
      }
    }
    if (name === 'default' && node.type === 'ExportDefaultDeclaration') {
      return node.declaration.type === 'Identifier' ? node.declaration.name : 'id' in node.declaration ? nameOf(node.declaration.id) ?? name : name;
    }
  }
  return name;
}

/** Keep local import-x checks; replace its unguarded star traversal. */
export function createExportGraphRule(localRule: Rule.RuleModule, resolver: ReturnType<typeof createProjectResolver>): Rule.RuleModule {
  return {
    meta: localRule.meta,
    create(context) {
      const parser = createExportParser();
      // import-x prioritizes alternate parsers/parserPath over languageOptions.parser.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Preserve Oxlint context services, adapting only the child-parser interface expected by import-x.
      const adapted = Object.create(context, {
        parserPath: { value: undefined },
        languageOptions: { value: { ...context.languageOptions, parser } },
        settings: { value: { ...context.settings, 'import-x/parsers': undefined } },
      }) as Parameters<typeof ExportMap.parse>[2];
      const modules = new Map<string, Module | null>();
      function load(path: string, content?: string): Module | null {
        const canonical = realpathSync(path);
        if (modules.has(canonical)) {
          return modules.get(canonical) ?? null;
        }
        if (modules.size >= 10000) {
          throw new Error('Export graph exceeds 10000 modules; simplify the re-export graph.');
        }
        const map = ExportMap.parse(canonical, content ?? readFileSync(canonical, 'utf8'), adapted);
        if (map === null) {
          modules.set(canonical, null);
          return null;
        }
        if (map.errors.length > 0) {
          throw new Error(`Cannot parse ${canonical}: ${map.errors.map((error) => error.message).join('; ')}`);
        }
        const program = parser.programs.get(canonical);
        if (program === undefined) {
          throw new Error(`Child parser did not supply an export program for ${canonical}.`);
        }
        const module = { map, program };
        modules.set(canonical, module);
        return module;
      }
      function imported(module: Module, source: string): Module | null {
        const result = resolver.resolve(source, module.map.path);
        if (!result.found) {
          throw new Error(`Cannot resolve '${source}' from ${module.map.path}; check resolverOptions and the re-export path.`);
        }
        return result.path === null ? null : load(result.path);
      }
      function dependencies(module: Module): Array<Module | null> {
        return module.program.body.flatMap((node) => node.type === 'ExportAllDeclaration' && node.exported === null ? [imported(module, node.source.value)] : []);
      }
      function localBinding(module: Module, name: string, state: Traversal): Binding {
        const local = localName(module.program, name);
        for (const declaration of module.program.body) {
          if (declaration.type === 'ExportAllDeclaration' && nameOf(declaration.exported) === name) {
            const child = imported(module, declaration.source.value);
            return namespaceBinding(child);
          }
          if (declaration.type !== 'ImportDeclaration') {
            continue;
          }
          const binding = declaration.specifiers.find((item) => item.local.name === local);
          if (binding !== undefined) {
            const child = imported(module, declaration.source.value);
            if (binding.type === 'ImportNamespaceSpecifier') {
              return namespaceBinding(child);
            }
            return resolveBinding(child, binding.type === 'ImportDefaultSpecifier' ? 'default' : nameOf(binding.imported) ?? local, state);
          }
        }
        return identity(module.map.path, local);
      }
      function resolveBinding(module: Module | null, name: string, state: Traversal): Binding {
        if (module === null) {
          return null;
        }
        const key = identity(module.map.path, name);
        if (state.seen.has(key)) {
          return null;
        }
        if (state.depth >= 512) {
          throw new Error(`Export graph exceeds depth 512 at ${module.map.path}; simplify the re-export chain.`);
        }
        state.seen.add(key);
        const next = { seen: state.seen, depth: state.depth + 1 };
        if (module.map.namespace.has(name)) {
          return localBinding(module, name, next);
        }
        const reexport = module.map.reexports.get(name);
        if (reexport !== undefined) {
          const declaration = module.program.body.find((node) => node.type === 'ExportNamedDeclaration' && node.source !== null && node.specifiers.some((item) => nameOf(item.exported) === name));
          if (declaration?.type !== 'ExportNamedDeclaration' || declaration.source === null) {
            throw new Error(`Cannot locate re-export '${name}' in ${module.map.path}.`);
          }
          return resolveBinding(imported(module, declaration.source.value), reexport.local, next);
        }
        if (name === 'default') {
          return null;
        }
        return starBinding(module, name, next);
      }
      function starBinding(module: Module, name: string, state: Traversal): Binding {
        let resolved: Binding = null;
        for (const child of dependencies(module)) {
          const binding = resolveBinding(child, name, state);
          if (binding === ambiguous || (binding !== null && resolved !== null && binding !== resolved)) {
            return ambiguous;
          }
          resolved ??= binding;
        }
        return resolved;
      }
      function exportedNames(module: Module | null): Set<string> {
        const names = new Set<string>();
        const seen = new Set<string>();
        const pending = [module];
        while (pending.length > 0) {
          const current = pending.pop();
          if (current === null || current === undefined || seen.has(current.map.path)) {
            continue;
          }
          seen.add(current.map.path);
          for (const name of [...current.map.namespace.keys(), ...current.map.reexports.keys()]) {
            if (name !== 'default') {
              names.add(name);
            }
          }
          pending.push(...dependencies(current));
        }
        return names;
      }
      const stars: Rule.Node[] = [];
      function reportConflicts(root: Module, branches: Branch[]): void {
        for (const name of new Set(branches.flatMap((branch) => [...branch.names]))) {
          if (root.map.namespace.has(name) || root.map.reexports.has(name) || resolveBinding(root, name, { seen: new Set(), depth: 0 }) !== ambiguous) {
            continue;
          }
          for (const branch of branches) {
            if (branch.names.has(name) && resolveBinding(branch.module, name, { seen: new Set(), depth: 0 }) !== null) {
              context.report({ node: branch.node, message: `Conflicting star exports of '${name}' resolve to different bindings.` });
            }
          }
        }
      }
      const localListeners = localRule.create(context);
      return {
        ...localListeners,
        ExportAllDeclaration(node) {
          if (node.exported === null) {
            stars.push(node);
          }
        },
        'Program:exit'(node) {
          localListeners['Program:exit']?.(node);
          const firstStar = stars[0];
          if (firstStar === undefined) {
            return;
          }
          try {
            const root = load(context.filename, context.sourceCode.text);
            if (root === null) {
              throw new Error(`Cannot inspect export program ${context.filename}.`);
            }
            const branches = stars.map((star) => {
              if (star.type !== 'ExportAllDeclaration') {
                throw new Error('Expected a star-export declaration.');
              }
              if (typeof star.source.value !== 'string') {
                throw new TypeError('Expected a string re-export path.');
              }
              const child = imported(root, star.source.value);
              return { node: star, module: child, names: exportedNames(child) };
            });
            reportConflicts(root, branches);
          }
          catch (error) {
            context.report({ node: firstStar, message: `Cannot inspect re-export graph: ${error instanceof Error ? error.message : String(error)}` });
          }
        },
      };
    },
  };
}
