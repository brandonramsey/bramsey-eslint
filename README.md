# @brandonramsey/eslint

This checkout now exports a compiled native Oxlint configuration and bundled Stylistic plugin. See [the current configuration interface](docs/oxlint-configuration.md). Migration work continues in #9–#14; the sections below describe the published ESLint `0.1.0` release until the documentation migration in #12. The `test:consumer` command now inspects the packed package directly, without installing a consumer or running a lint engine.

A strict, opinionated ESLint configuration for framework-neutral Node TypeScript projects, including JavaScript, JSX, TSX, and handwritten declarations. ESLint owns formatting. Parsers, plugins, and import resolution are installed automatically with this package.

The initial version is `0.1.0`. The policy is being validated before `1.0`; review upgrades before adopting them.

## Install

Your TypeScript project already supplies its compiler. Install only this package and ESLint as additional lint dependencies:

```fish
npm install --save-dev @brandonramsey/eslint eslint
```

Requirements:

- ESLint `^10.4.0`, flat config only.
- TypeScript `>=5.9.0 <6.1.0`, supplied by the project.
- Node `^22.13.0 || >=24.0.0` to run linting.
- Application compatibility targets Node **24+**, independently of the linting runtime.
- Supported tsconfigs enable `strict: true` and `noUncheckedIndexedAccess: true`. Run `tsc` separately; linting does not replace compiler diagnostics or validate every compiler option.

Standalone JavaScript projects and browser/framework presets are outside the first-release support promise.

## Configure

Create `eslint.config.mjs` at the project root:

```js
import config from '@brandonramsey/eslint';

export default config;
```

The default uses the working directory as the project root. Run ESLint from that root. For an explicit root, files outside tsconfig, or monorepo customization:

```js
import { fileURLToPath } from 'node:url';

import { createConfig } from '@brandonramsey/eslint';

export default createConfig({
  projectRoot: fileURLToPath(new URL('.', import.meta.url)),
  syntaxOnlyFiles: ['eslint.config.ts', 'tools/**/*.ts'],
  testFiles: ['fixtures/**/*.{ts,tsx}'],
  ignores: ['generated/**'],
  // For nonstandard compiler configuration filenames:
  // resolverOptions: { project: ['packages/*/tsconfig.app.json'] },
});
```

Patterns are relative to the ESLint configuration's base directory. Keep that directory aligned with `projectRoot`. Imports use the nearest discovered tsconfig and its references; import resolution can be customized with `resolverOptions`. Type checking uses TypeScript project service and each file's nearest tsconfig. Unexpectedly excluded TypeScript files fail rather than silently losing typed checks. Resolver options customize imports, not project-service membership.

The package infers module mode for `.js`, `.jsx`, `.ts`, and `.tsx` from the nearest discovered package boundary's `type` field. `.mjs`/`.mts` always use ESM; `.cjs`/`.cts` always use CommonJS. Override ambiguous files with `moduleFiles` or `commonjsFiles`. The package itself is ESM; consuming applications can use either module system.

Ordinary ESLint overrides can be appended:

```js
import config from '@brandonramsey/eslint';

export default [
  ...config,
  {
    files: ['src/integration/**/*.ts'],
    rules: { '@typescript-eslint/no-unsafe-type-assertion': 'off' },
  },
];
```

## Policy

All enabled rules are errors. The production policy bans explicit `any`, non-null assertions, enums, and `@ts-ignore`; requires explained `@ts-expect-error`, separate type imports, type aliases, exported return annotations, handled promises, and explicit primitive truthiness/coercion. It enforces camelCase bindings, PascalCase types, kebab-case filenames, sorted imports, Node protocols, complexity 10, nesting 4, and parameters 4. External property names are exempt.

Formatting uses two spaces, single quotes with escaping exceptions, semicolons, multiline trailing commas, mandatory braces and arrow parentheses, LF, and double-quoted JSX attributes. There is no hard line-length limit. Common abbreviations, null, forEach/reduce, array mutation, and synchronous CLI APIs remain available. Immediate process termination requires an explained exception; prefer `process.exitCode`.

Standard `*.test.*`, `*.spec.*`, and `__tests__` files automatically receive a relaxed test profile. It permits `any`, unsafe fixture operations, non-null assertions, inferred exported returns, and arbitrary filenames; structural limits are off. Formatting, import checks, and other typed correctness checks remain. Use `testFiles` for fixtures, or `tests: false` to retain the production policy in tests. Typed tests still belong to a tsconfig unless explicitly syntax-only.

Handwritten `.d.ts`, `.d.mts`, and `.d.cts` files receive syntax-only checks. Interfaces, namespaces, ambient enums, and global `var` are permitted; formatting, imports, and the `any` ban remain. Generated `dist`, `build`, `coverage`, and dependency directories are ignored. Identify other generated files through `ignores`.

Inline disable directives require descriptions, and unused disables are errors:

```js
// eslint-disable-next-line n/no-process-exit -- Immediate termination is required after this fatal startup failure.
process.exit(1);
```

The rule verifies that an explanation is present; reviewers assess its adequacy.

## Every rule and default

See the [generated profile index](examples/README.md) and its executable modules. Every profile lists every available ESLint core and shipped-plugin rule, including disabled and deprecated rules, with normalized configured severity and options. Rule-internal defaults not emitted by ESLint are not expanded. Consumer overrides can change these settings.

The [design](docs/design.md), [explicit policy](docs/rule-policy.md), and [decision records](docs/adr) document the choices. Upstream dependencies are pinned; upgrades require reviewing policy/reference changes. After `1.0`, newly enforced rules, stricter defaults, and raised runtime requirements require major releases. Upgrades to consumer-owned ESLint or TypeScript can independently affect diagnostics.

## Development and release

```fish
npm ci
npm run references
npm run check
npm run test:consumer
```

CI verifies Node 22.13 and 24, valid/invalid behavior, profile differences, monorepo resolution, generated-reference drift, and a packed consumer installing only the package, ESLint, and TypeScript directly. The publishing workflow validates explicit version tags and uses npm trusted publishing. See [release setup](docs/releasing.md) for the one-time account configuration and tag procedure.

Licensed under [ISC](LICENSE).
