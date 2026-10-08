# Native Oxlint configuration

Issue #8 establishes the TypeScript package and native configuration, under the existing `@brandonramsey/eslint` identity pending #4. Consumers install the package and the pinned peer `oxlint@1.87.0`; `oxlint-tsgolint@7.0.2003`, Stylistic and its ESLint provider/types are package dependencies. ESLint is a provider dependency; the exported configuration uses Oxlint. Build ESM and declarations with `npm run build`. The default export is one Oxlint object; `createConfig` and the native `OxlintConfig`, `OxlintOverride` and `ConfigOptions` types are public. The compiled Stylistic plugin is also exported as `@brandonramsey/eslint/plugins/style`.

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

The factory accepts `projectRoot`, `ignores`, `tests`, `testFiles`, `syntaxOnlyFiles`, `commonjsFiles`, `moduleFiles` and `overrides`. Generated/dependency/build exclusions remain when `ignores` extends them. Standard test patterns and `testFiles` receive relaxed fixture/convention settings while retaining promise checks; `tests: false` removes that profile. Declarations allow augmentation and disable typed checks while retaining the syntax-level any ban and blanket-disable rejection. Syntax-only patterns disable every typed check after the test profile. Consumer overrides are always last and may re-enable or disable policy explicitly.

The nearest package boundary selects Node globals for ambiguous `.js`, `.jsx`, `.ts` and `.tsx` extensions. CommonJS patterns apply before module patterns; dedicated `.cjs`/`.cts` and `.mjs`/`.mts` extensions then take precedence. These settings choose globals and policy, not native parsing or scope mode. See [ADR 0016](adr/0016-use-native-parsing-with-package-aware-policy.md). Native overrides accept only `files`, `excludeFiles`, `rules`, `globals`, `env`, `plugins` and `jsPlugins`. ESLint fields, per-file settings and root-only options are rejected. Native rule-specific option validation remains Oxlint's responsibility.

## Remaining migration work

This foundation does not complete parent #2 or the release migration. Selected compatibility/import rules and resolver options are #9 work; guarded export checks are #10; inferred-coverage warnings are #11. Those JavaScript policy rules are not advertised or configured until their implementations ship. The current configuration includes the validated native rules and style settings, not a substitute ESLint fallback. Disable-comment explanations remain unenforced.

Public contract tests import built and unpacked modules and inspect exports, declarations, metadata, settings, composition and plugin specifiers. They install no temporary consumer and execute no lint engine. Repository self-lint and historical reference generation temporarily use the isolated `scripts/legacy-eslint` policy; those development modules are outside the packed package. TypeScript tooling and Oxlint self-lint conversion belong to #13, and native reference/example generation to #14. Current exhaustive reference outputs remain historical ESLint outputs until that work completes; #12 reconciles the remaining documentation and support boundaries. The `test:consumer` command is retained as a compatibility name for direct packed-package inspection.

Observed overlapping Stylistic fixes required multiple invocations in the research candidate. Consumers manage repeat fixing; one invocation is not promised to reach the former ESLint output, and no universal convergence bound is claimed.
