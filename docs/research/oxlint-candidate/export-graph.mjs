/* eslint-disable complexity -- This bounded experiment follows the ResolveExport precedence and cycle guards. */
import { realpathSync } from 'node:fs';

const ambiguous = Symbol('ambiguous export');
const nameOf = (node) => node?.name ?? node?.value;
const identity = (path, name) => JSON.stringify([realpathSync(path), name]);

function importedModule(map, source) {
  const imported = [...map.imports.values()].find((entry) => [...entry.declarations].some((node) => node.source.value === source));
  return imported?.getter() ?? null;
}

function localBinding(map, name, parser) {
  const node = map.exports.get(name);
  const specifier = node?.specifiers?.find((item) => nameOf(item.exported) === name);
  let local = specifier ? nameOf(specifier.local) : name;
  if (node?.type === 'ExportDefaultDeclaration') {
    local = node.declaration.type === 'Identifier' ? node.declaration.name : node.declaration.id?.name ?? name;
  }
  // A local export of an imported binding still identifies the defining module.
  const program = parser.programs.get(map.path);
  for (const declaration of program?.body ?? []) {
    if (declaration.type !== 'ImportDeclaration') {
      continue;
    }
    const imported = declaration.specifiers.find((item) => nameOf(item.local) === local);
    if (imported) {
      const child = importedModule(map, declaration.source.value);
      const importedName = imported.type === 'ImportDefaultSpecifier' ? 'default' : imported.type === 'ImportNamespaceSpecifier' ? '*' : nameOf(imported.imported);
      return { child, importedName };
    }
  }
  const namespace = program?.body.find((item) => item.type === 'ExportAllDeclaration' && nameOf(item.exported) === name);
  if (namespace) {
    return { child: map.namespace.get(name).namespace ?? importedModule(map, namespace.source.value), importedName: '*' };
  }
  return identity(map.path, local);
}

function resolveBinding(map, name, parser, state) {
  if (!map) {
    return null;
  }
  if (map.errors.length) {
    throw new Error(map.errors.map((error) => error.message).join('; '));
  }
  const key = identity(map.path, name);
  if (state.seen.has(key)) {
    return null;
  }
  if (state.depth >= 512) {
    throw new Error('Export graph exceeds the bounded traversal depth (512).');
  }
  state.seen.add(key);
  const next = { seen: state.seen, depth: state.depth + 1 };
  if (map.namespace.has(name)) {
    const binding = localBinding(map, name, parser);
    if (typeof binding === 'string') {
      return binding;
    }
    return binding.importedName === '*' ? binding.child && identity(binding.child.path, '*namespace*') : resolveBinding(binding.child, binding.importedName, parser, next);
  }
  const reexport = map.reexports.get(name);
  if (reexport) {
    return resolveBinding(reexport.getImport(), reexport.local, parser, next);
  }
  if (name === 'default') {
    return null;
  }
  let resolved = null;
  for (const getDependency of map.dependencies) {
    const binding = resolveBinding(getDependency(), name, parser, next);
    if (binding === ambiguous || (binding !== null && resolved !== null && binding !== resolved)) {
      return ambiguous;
    }
    resolved ??= binding;
  }
  return resolved;
}

function exportedNames(map) {
  const names = new Set();
  const seen = new Set();
  const pending = [map];
  while (pending.length) {
    const current = pending.pop();
    if (!current || seen.has(realpathSync(current.path))) {
      continue;
    }
    if (seen.size >= 10000) {
      throw new Error('Export graph exceeds the bounded module count (10000).');
    }
    seen.add(realpathSync(current.path));
    if (current.errors.length) {
      throw new Error(current.errors.map((error) => error.message).join('; '));
    }
    for (const name of [...current.namespace.keys(), ...current.reexports.keys()]) {
      if (name !== 'default') {
        names.add(name);
      }
    }
    for (const getDependency of current.dependencies) {
      pending.push(getDependency());
    }
  }
  return names;
}

// Retains import-x's local checks, replacing only its star-export traversal.
export function createExportGraphRule(ExportMap, parser, localRule) {
  return {
    meta: localRule.meta,
    create(context) {
      const stars = [];
      const localListeners = localRule.create(context);
      return {
        ...localListeners,
        ExportAllDeclaration(node) {
          if (!node.exported) {
            stars.push(node);
          }
        },
        'Program:exit'(programNode) {
          localListeners['Program:exit']?.(programNode);
          if (!stars.length) {
            return;
          }
          try {
            const root = ExportMap.parse(context.filename, context.sourceCode.text, Object.create(context, { path: { value: context.filename } }));
            if (!root) {
              return;
            }
            const branches = stars.map((node) => {
              const map = importedModule(root, node.source.value);
              return { node, map, names: exportedNames(map) };
            });
            const names = new Set(branches.flatMap((branch) => [...branch.names]));
            for (const name of names) {
              if (root.namespace.has(name) || root.reexports.has(name)) {
                continue;
              }
              const binding = resolveBinding(root, name, parser, { seen: new Set(), depth: 0 });
              if (binding !== ambiguous) {
                continue;
              }
              for (const branch of branches) {
                if (branch.names.has(name) && resolveBinding(branch.map, name, parser, { seen: new Set(), depth: 0 }) !== null) {
                  context.report({ node: branch.node, message: `Conflicting star exports of '${name}' resolve to different bindings.` });
                }
              }
            }
          }
          catch (error) {
            context.report({ node: stars[0].source, message: `Cannot inspect re-export graph: ${error.message}` });
          }
        },
      };
    },
  };
}
