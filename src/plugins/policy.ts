import { builtinRules } from 'eslint/use-at-your-own-risk';
import importPlugin from 'eslint-plugin-import-x';
import nodePlugin from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';

import { validateOptions } from '../options.js';
import { createProjectResolver } from '../resolver.js';

import type { ResolverOptions } from '../options.js';
import type { ESLint, Rule } from 'eslint';

const providers: Record<string, ESLint.Plugin> = { import: importPlugin, node: nodePlugin, unicorn };
const selected = {
  'no-dupe-args': ['core', 'no-dupe-args'],
  'no-octal': ['core', 'no-octal'],
  'no-restricted-syntax': ['core', 'no-restricted-syntax'],
  'no-unresolved': ['import', 'no-unresolved'],
  'no-useless-path-segments': ['import', 'no-useless-path-segments'],
  'no-extraneous-dependencies': ['import', 'no-extraneous-dependencies'],
  order: ['import', 'order'],
  'no-deprecated-api': ['node', 'no-deprecated-api'],
  'node-builtins': ['node', 'no-unsupported-features/node-builtins'],
  'es-builtins': ['node', 'no-unsupported-features/es-builtins'],
  'no-process-exit': ['node', 'no-process-exit'],
  'prefer-node-protocol': ['node', 'prefer-node-protocol'],
  'no-unnecessary-polyfills': ['unicorn', 'no-unnecessary-polyfills'],
} as const;

function unresolvedProjects(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && 'project' in value && Array.isArray(value.project) && value.project.length === 0) {
    // An empty discovered list selects the no-alias fallback, not a consumer pattern.
    return { ...value, project: undefined };
  }
  return value;
}

function policySettings(value: unknown): { projectRoot: string; resolverOptions: ResolverOptions } {
  if (value === null || typeof value !== 'object' || !('projectRoot' in value) || !('resolverOptions' in value)) {
    throw new TypeError('Policy import rules require createConfig resolver settings.');
  }
  const options = { projectRoot: value.projectRoot, resolverOptions: unresolvedProjects(value.resolverOptions) };
  validateOptions(options);
  if (typeof options.projectRoot !== 'string' || options.resolverOptions === undefined) {
    throw new TypeError('Policy import rules require projectRoot and resolverOptions.');
  }
  return { projectRoot: options.projectRoot, resolverOptions: options.resolverOptions };
}

function bridge(rule: Rule.RuleModule, imports: boolean): Rule.RuleModule {
  return {
    ...rule,
    create(context) {
      if (!imports) {
        return rule.create(context);
      }
      const options = policySettings(context.settings.policy);
      const resolver = createProjectResolver(options.projectRoot, options.resolverOptions);
      // Preserve inherited getters, source services and methods supplied by Oxlint.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.create preserves the complete rule context prototype; only settings is replaced.
      const adapted = Object.create(context, {
        settings: { value: { ...context.settings, 'import-x/resolver-next': [resolver] }, enumerable: true },
      }) as Rule.RuleContext;
      return rule.create(adapted);
    },
  };
}

const rules = Object.fromEntries(Object.entries(selected).map(([name, [owner, id]]) => {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Pinned ESLint rule-provider entry point; required exports are verified from the packed plugin.
  const rule = owner === 'core' ? builtinRules.get(id) : providers[owner]?.rules?.[id];
  if (rule === undefined) {
    throw new Error(`Bundled policy provider is missing ${owner}/${id}.`);
  }
  return [name, bridge(rule, owner === 'import')];
}));

const plugin: ESLint.Plugin & { rules: Record<string, Rule.RuleModule> } = { meta: { name: '@brandonramsey/eslint/policy' }, rules };
export default plugin;
