# @brandonramsey/eslint

A strict, opinionated Oxlint configuration for framework-neutral Node TypeScript projects, including their JavaScript, JSX, TSX and handwritten declarations. The package exports one native configuration object, a `createConfig` factory, public types and bundled style/policy plugins. Consumers own lint execution and fixing.

This checkout implements the Oxlint migration. The published `0.1.0` release used ESLint; these instructions apply to the next package build. The identity cutover to `@brandonramsey/lint` and the release workflows remain separate work in #4/#5. The policy is being validated before `1.0`; review upgrades before adopting them.

## Install

Install the configuration package and its exact Oxlint peer:

```fish
npm install --save-dev @brandonramsey/eslint oxlint@1.87.0
```

The package supplies `oxlint-tsgolint@7.0.2003`, Stylistic and all required compatibility providers. They require no separate consumer installation. ESLint is a bundled rule provider, while the exported configuration uses Oxlint.

Requirements:

- Node `^22.13.0 || >=24.0.0` for the package and its bundled providers. TypeScript config execution requires Node 22.18+ or 24+; use an explicit `.mjs` config on earlier supported Node 22.
- Oxlint exactly `1.87.0`. Dependency upgrades require policy and public contract review.
- Application APIs target Node **24+**, independently of the linting runtime.
- Checking the public declarations requires TypeScript 5.9+ through their bundled provider types; verification uses 6.0.3.
- Supported projects use `strict: true` and `noUncheckedIndexedAccess: true`. Run the project's compiler separately for diagnostics.

The consumer's TypeScript compiler is separate from tsgolint's embedded TypeScript 7.0.2 target. Public types/builds are checked with TypeScript 6.0.3, the newest stable compiler supported by the retained repository toolchain; typescript-eslint is the upgrade-blocking family. See [support boundaries and evidence](docs/support.md).

Standalone JavaScript projects and browser/framework presets remain outside the support promise.

## Configure and run

Create `oxlint.config.mts` at the project root:

```ts
import config from '@brandonramsey/eslint';

export default config;
```

The default uses cwd as `projectRoot`. Run from that root and select the config explicitly:

```fish
npx oxlint --config oxlint.config.mts .
npx oxlint --config oxlint.config.mts --fix .
```

For an explicit root, syntax-only files, fixtures and workspace resolution:

```ts
import { createConfig } from '@brandonramsey/eslint';

export default createConfig({
  projectRoot: import.meta.dirname,
  syntaxOnlyFiles: ['tools/**/*.ts'],
  testFiles: ['fixtures/**/*.{ts,tsx}'],
  ignores: ['generated/**'],
  resolverOptions: { project: ['tsconfig.json', 'packages/*/tsconfig.app.json'] },
  overrides: [
    {
      files: ['src/integration/**/*.ts'],
      rules: { 'typescript/no-unsafe-type-assertion': 'off' },
    },
  ],
});
```

Keep cwd, the config directory, selected paths and `projectRoot` aligned. Patterns are relative to the config directory; import project patterns resolve from the canonical project root. Resolver options configure imports, not tsgolint project membership. Native overrides are appended last. See [all options and composition rules](docs/oxlint-configuration.md).

On supported Node 22 before 22.18, use the [basic `.mjs` example](examples/basic-config.mjs), save it as `oxlint.config.mjs` and pass `--config oxlint.config.mjs`. Oxlint does not auto-discover that filename.

Native Oxlint/tsgolint owns project selection and inferred programs. Files outside configured projects can receive inferred settings; this package emits no custom coverage warning or independent compiler preflight. Explicit syntax-only patterns and handwritten declarations disable the configured typed rules. Import discovery and project references retain their separate resolver contract.

Nearest package boundaries and dedicated file extensions select Node globals. `moduleFiles` and `commonjsFiles` can customize policy for ambiguous extensions, but cannot force native parser or scope mode. The package itself is ESM; consuming applications may use ESM or CommonJS.

## Policy and limitations

All enabled rules are errors. Production policy bans explicit `any`, non-null assertions, enums and `@ts-ignore`; requires explained `@ts-expect-error`, separate type imports, type aliases, exported return annotations, handled promises and explicit primitive truthiness/coercion. Native `id-match` supplies simplified declaration naming; it does not reproduce the former selector-based naming convention. The policy retains kebab-case filenames, sorted imports, Node protocols, complexity 10, nesting 4 and parameters 4.

Stylistic owns formatting: two spaces, single quotes with escaping exceptions, semicolons, multiline trailing commas, braces, arrow parentheses, LF and double-quoted JSX attributes. No Oxfmt or hard line-length limit is added. Familiar abbreviations, null, forEach/reduce, array mutation and synchronous CLI APIs remain available. Prefer `process.exitCode`; intentional `process.exit` requires a narrow inline exception.

Standard `*.test.*`, `*.spec.*` and `__tests__` files receive a relaxed profile. It permits fixture `any`/unsafe operations, non-null assertions, inferred exported returns and arbitrary filenames; structural limits are off. Formatting, imports and promise checks remain. Use `testFiles` for fixtures or `tests: false` to retain production settings. `.d.ts`, `.d.mts` and `.d.cts` use syntax-only declaration settings permitting interfaces, namespaces, ambient enums and required global `var`, while retaining imports, formatting and the `any` ban. Generated output and dependency directories are ignored; extend exclusions through `ignores`.

Disable-comment descriptions are recommended but **unenforced** under [ADR 0017](docs/adr/0017-publish-configuration-and-plugins-without-a-runner.md). Unused directives are errors and blanket disables are rejected:

```js
// oxlint-disable-next-line policy/no-process-exit -- Immediate termination is required after this fatal startup failure.
process.exit(1);
```

The JavaScript bridge and scoped child parser have documented limits. Research observed overlapping Stylistic fixes requiring multiple invocations; one `--fix` pass is not promised to reproduce the former ESLint output. Consumers manage repeat fixing, warning flags and exit handling. The package publishes no lint executable or execution helper. See [support limits](docs/support.md).

## References and development

The [reference index](examples/README.md) currently labels the exhaustive ESLint snapshots as historical. They do not describe or compose with the native Oxlint configuration. Native inventory and a complete generated editable example belong to #14. The basic consumer example already uses the current public default export.

The [design](docs/design.md), [policy](docs/rule-policy.md) and [ADRs](docs/adr) record current decisions and superseded contracts. Historical research remains evidence. After `1.0`, newly enforced rules, stricter defaults and raised runtime requirements require major releases.

```fish
npm ci
npm run check
```

The check builds and strictly typechecks package sources, repository configuration and contract tests, self-lints with Oxlint/tsgolint and the bundled plugins, tests public configuration and packed modules/declarations/assets, and checks historical reference drift. Tests install no consumer and invoke no lint engine. `npm run test:package` runs packed inspection alone.

`npm run build:tools` first builds the public package, then compiles `oxlint.config.ts` and `test/*.test.ts` into ignored `.tooling/` output. It copies the compiled configuration to ignored `oxlint.config.js` at the repository root so Oxlint's file patterns stay rooted correctly. Commands rebuild this output each time; no committed serialized configuration can drift. This path runs JavaScript on the full supported Node range, including 22.13, without native TypeScript loading. Run commands from the repository root:

```fish
npm run typecheck
npm run lint
npm test
npm run test:package
```

Intentional format fixtures and generated consumer examples retain their formats. Historical research and the isolated legacy ESLint reference generator are excluded from current strict checking and self-lint; generator conversion and native inventory belong to #14. Existing release workflows are historical pending #5; see [release setup and history](docs/releasing.md).

Licensed under [ISC](LICENSE).
