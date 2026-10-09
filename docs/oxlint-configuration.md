# Native Oxlint configuration

Issues #8 and #9 establish the TypeScript package, native configuration and bundled compatibility policy, under the existing `@brandonramsey/eslint` identity pending #4. Consumers install the package and the pinned peer `oxlint@1.87.0`; `oxlint-tsgolint@7.0.2003`, Stylistic, import-x, its TypeScript resolver, the Node and Unicorn providers, UnRS and ESLint are package dependencies. ESLint supplies selected rules and types; the exported configuration uses Oxlint. Build ESM and declarations with `npm run build`. The default export is one Oxlint object; `createConfig` and the `OxlintConfig`, `OxlintOverride`, `ConfigOptions` and `ResolverOptions` types are public. Compiled plugins are also exported as `@brandonramsey/eslint/plugins/style` and `@brandonramsey/eslint/plugins/policy`.

Create `oxlint.config.ts` in the consuming project root:

```ts
import { createConfig } from '@brandonramsey/eslint';

export default createConfig({
  projectRoot: import.meta.dirname,
  syntaxOnlyFiles: ['tools/**/*.ts'],
  overrides: [
    { files: ['fixtures/**'], rules: { 'typescript/no-explicit-any': 'off' } },
  ],
});
```

Consumers own invocation, file selection, warning-failure flags, fixing and exit handling. For example, from the configuration's directory:

```fish
npx oxlint --config oxlint.config.ts .
```

Keep cwd, the configuration directory, selected paths and `projectRoot` aligned. File patterns remain relative to the configuration directory. The factory canonicalizes its absolute project root and compiled plugin paths; it cannot enforce the consumer's invocation or prevent nested configuration replacement during automatic lookup. Use an explicit configuration. No lint executable, execution helper or independent preflight is exported. Run the project's compiler separately from typed linting.

## Composition

The configuration disables inherited correctness defaults, loads native TypeScript/import/Node/Unicorn owners, explicitly sets all 66 validated Stylistic settings and keeps type-aware checks enabled. The 48 typed checks retain promise and unsafe-value safety. Native `no-inner-declarations` explicitly allows block-scoped functions. Native unused-disable-directive errors and blanket-disable rejection remain configured; explanations for lint-disable comments are an accepted unenforced limitation under [ADR 0017](adr/0017-publish-configuration-and-plugins-without-a-runner.md).

The factory accepts `projectRoot`, `ignores`, `tests`, `testFiles`, `syntaxOnlyFiles`, `resolverOptions`, `commonjsFiles`, `moduleFiles` and `overrides`. Generated/dependency/build exclusions remain when `ignores` extends them. Standard test patterns and `testFiles` receive relaxed fixture/convention settings while retaining promise checks; `tests: false` removes that profile. Declarations allow augmentation and disable typed checks while retaining the syntax-level any ban and blanket-disable rejection. Syntax-only patterns disable every typed check after the test profile. Consumer overrides are always last and may re-enable or disable policy explicitly.

The nearest package boundary selects Node globals for ambiguous `.js`, `.jsx`, `.ts` and `.tsx` extensions. CommonJS patterns apply before module patterns; dedicated `.cjs`/`.cts` and `.mjs`/`.mts` extensions then take precedence. These settings choose globals and policy, not native parsing or scope mode. See [ADR 0016](adr/0016-use-native-parsing-with-package-aware-policy.md). Native overrides accept only `files`, `excludeFiles`, `rules`, `globals`, `env`, `plugins` and `jsPlugins`. ESLint fields, per-file settings and root-only options are rejected. Native rule-specific option validation remains Oxlint's responsibility.

## Import resolution and compatibility policy

By default, the factory discovers `**/tsconfig.json` below `projectRoot`, excluding dependency/generated directories. The policy plugin selects the containing project with the nearest directory for each canonical file path. Each selected project uses its own resolver with automatic TypeScript references and the provider's declaration-aware extension aliases and package conditions. Required referenced declaration outputs must exist; run the project's build when its imports depend on those outputs. Files without a containing discovered project use a resolver with no tsconfig aliases. Resolver instances belong to each rule context, so unrelated roots do not share a package resolver cache.

Use `resolverOptions.project` for custom configuration filenames or a narrower project inventory. Patterns and relative filenames resolve from the canonical `projectRoot`; they must identify configuration files. Explicit patterns matching no files fail during configuration creation. Other serializable provider options, such as `extensions`, `extensionAlias`, `conditionNames` and `alwaysTryTypes`, are preserved. Native `tsconfig` overrides are rejected because the package controls nearest-project selection. For example:

```ts
export default createConfig({
  projectRoot: import.meta.dirname,
  resolverOptions: {
    project: ['tsconfig.json', 'packages/*/tsconfig.app.json'],
    extensions: ['.ts', '.tsx', '.js', '.custom'],
    alwaysTryTypes: true,
  },
});
```

Import resolution is separate from typed-engine project membership. These options neither configure tsgolint's project selection nor grant configured typed coverage to a file. Import and rule settings are serialized in the native configuration; the bundled plugin creates executable resolver objects during ordinary consumer-owned linting.

The `policy` plugin enables unresolved imports (including CommonJS), redundant import paths, extraneous dependencies and import ordering. It also retains Node 24 runtime/deprecation/exit checks, Node-protocol preference, unnecessary-polyfill rejection, enum rejection, and the duplicate-argument/octal checks needed for non-strict CommonJS. Declarations retain import checks but disable runtime checks and allow ambient enums; TypeScript disables the duplicate-argument bridge check. The bridge preserves the context prototype and source services. Its three ESLint core rule providers use the pinned `eslint/use-at-your-own-risk` entry point; packed-module checks verify those rule exports, and dependency upgrades must recheck them.

## Remaining migration work

The `policy/export` rule retains import-x's local export checks and adds guarded star-export inspection through the selected project resolver. Explicit exports override stars; repeated routes to the same underlying binding, namespace exports and static type-only exports are supported. Default exports are excluded from stars. Canonical module/name guards terminate cycles, and inspection failures or limits (512 binding-resolution steps and 10000 inspected modules per file) produce an error on a star-export statement with the failing path or corrective action.

Child inspection uses the bundled `oxc-parser@0.153.0` adapter for JavaScript and TypeScript extensions. This adapter computes UTF-16 locations, including CRLF and Unicode line separators, and supplies the empty token array required by import-x's export maps. It is scoped to export-name inspection, with no general ESLint-parser, scope or token-dependent JSDoc/deprecation compatibility. Oxlint retains its native main-file parser. Graph/program caches belong to each rule context; child loading avoids import-x's process-global export-map cache. Historical research fixtures remain separate from public contract tests.

This foundation does not complete parent #2 or the release migration. Inferred-coverage warnings remain #11 and are not configured until their implementation ships. Disable-comment explanations remain unenforced.

Public contract tests import built and unpacked modules and inspect exports, declarations, metadata, settings, composition and plugin specifiers. They install no temporary consumer and execute no lint engine. Repository self-lint and historical reference generation temporarily use the isolated `scripts/legacy-eslint` policy; those development modules are outside the packed package. TypeScript tooling and Oxlint self-lint conversion belong to #13, and native reference/example generation to #14. Current exhaustive reference outputs remain historical ESLint outputs until that work completes; #12 reconciles the remaining documentation and support boundaries. The `test:consumer` command is retained as a compatibility name for direct packed-package inspection.

Observed overlapping Stylistic fixes required multiple invocations in the research candidate. Consumers manage repeat fixing; one invocation is not promised to reach the former ESLint output, and no universal convergence bound is claimed.
