# @brandonramsey/lint

A strict, opinionated Oxlint configuration for framework-neutral Node TypeScript projects, including their JavaScript, JSX, TSX and handwritten declarations. The package exports one native configuration object, a `createConfig` factory, public types and bundled style/policy plugins. Consumers own lint execution and fixing.

This checkout prepares the first `@brandonramsey/lint` release, version `0.2.0`. The published `@brandonramsey/eslint@0.1.0` release used ESLint; these instructions apply to the next package build. The release workflow gates publication on the exact tagged commit's full matrix; registry bootstrap, publisher verification and explicit release authorization remain required. The policy is being validated before `1.0`; review upgrades before adopting them.

## Install

Install the configuration package and its exact Oxlint peer:

```fish
npm install --save-dev @brandonramsey/lint oxlint@1.87.0
```

The package supplies `oxlint-tsgolint@7.0.2003`, Stylistic and all required compatibility providers. They require no separate consumer installation. ESLint is a bundled rule provider, while the exported configuration uses Oxlint.

Requirements:

- Node `^22.13.0 || >=24.0.0` for the package and its bundled providers. TypeScript config execution requires Node 22.18+ or 24+; use an explicit `.mjs` config on earlier supported Node 22.
- Oxlint exactly `1.87.0`. Dependency upgrades require policy and public contract review.
- Application APIs target Node **24+**, independently of the linting runtime.
- Supported public declaration checking uses TypeScript 5.9+; repository checks use 6.0.3, and independent packed consumer checks pass at 5.9.3, 6.0.3 and 7.0.2.
- Supported projects use `strict: true` and `noUncheckedIndexedAccess: true`. Run the project's compiler separately for diagnostics.

The consumer's TypeScript compiler is separate from tsgolint's embedded TypeScript 7.0.2 target. Public types/builds are checked with TypeScript 6.0.3, the newest stable compiler supported by the retained repository toolchain; typescript-eslint is the upgrade-blocking family. See [support boundaries and evidence](docs/support.md).

Standalone JavaScript projects and browser/framework presets remain outside the support promise.

## Configure and run

Create `oxlint.config.mts` at the project root:

```ts
import config from '@brandonramsey/lint';

export default config;
```

The default uses cwd as `projectRoot`. Run from that root and select the config explicitly:

```fish
npx oxlint --config oxlint.config.mts .
npx oxlint --config oxlint.config.mts --fix .
```

For an explicit root, syntax-only files, fixtures and workspace resolution:

```ts
import { createConfig } from '@brandonramsey/lint';

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

Copy the [complete editable example](examples/complete-config.mjs) to your project root as `oxlint.config.mjs` to customize explicit rule settings while retaining default plugin loading and consumer-derived paths. Its unedited configuration matches the package defaults. Edit base entries in `rules` and profile-specific entries in the named maps; pass factory options to the final `createExample` call. The [reference index](examples/README.md) explains composition and lists every available native and packaged bridge rule, including disabled rules, across all 14 reference profiles. The basic consumer example remains the shortest default setup.

The [design](docs/design.md), [policy](docs/rule-policy.md) and [ADRs](docs/adr) record current decisions and superseded contracts. Historical research remains evidence. After `1.0`, newly enforced rules, stricter defaults and raised runtime requirements require major releases.

```fish
npm ci
npm run check
```

The check builds and strictly typechecks package sources, repository configuration, the reference generator and contract tests, self-lints with Oxlint/tsgolint and the bundled plugins, tests public configuration and packed modules/declarations/assets, and checks native inventory, profile, editable-example and summary drift. Tests install no consumer and invoke no lint engine. `npm run test:package` runs packed inspection alone.

`npm run build:tools` first builds the public package, then compiles `oxlint.config.ts`, `scripts/*.ts` and `test/*.test.ts` into ignored `.tooling/` output. It copies the compiled configuration to ignored `oxlint.config.js` at the repository root so Oxlint's file patterns stay rooted correctly. Commands rebuild this output each time. This path runs JavaScript on the full supported Node range, including 22.13, without native TypeScript loading. Run commands from the repository root:

```fish
npm run typecheck
npm run lint
npm test
npm run test:package
npm run references
npm run references:check
```

Intentional format fixtures and generated consumer examples retain their formats. The TypeScript generator uses pinned inventory metadata and public configuration/plugin exports without running per-rule probes. Generated `.mjs` consumer assets are checked for drift rather than reformatted by self-lint. Historical research and the unused isolated legacy ESLint policy remain outside current strict checking and self-lint. CI and tag releases validate Node 22.13/24 with TypeScript 5.9.3/6.0.3 using the pinned Oxlint/tsgolint pair; see [release setup, gate rehearsals and history](docs/releasing.md).

Licensed under [ISC](LICENSE).
