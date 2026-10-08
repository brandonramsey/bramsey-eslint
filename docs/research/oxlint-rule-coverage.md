# Oxlint coverage of this package's core policy

Assessed October 8, 2026 against this checkout's committed rule-reference profiles, Oxlint **1.87.0**, and the current upstream tsgolint checklist. The npm registry reports **oxlint-tsgolint 7.0.2003**; its version tracks TypeScript 7.0.2. These are dated findings, not an ongoing compatibility promise. [Oxlint package metadata](https://registry.npmjs.org/oxlint/1.87.0), [tsgolint package metadata](https://registry.npmjs.org/oxlint-tsgolint/7.0.2003), [tsgolint versioning](https://github.com/oxc-project/tsgolint#versioning).

## Findings

Oxlint is close on the package's TypeScript correctness checks but is not a complete native replacement for its current policy. **All 48 enabled rules in `typedRules` have upstream tsgolint implementations.** `naming-convention` has no native implementation; a dedicated third-party syntactic port is a recovery candidate, distinct from the original plugin that fails through the JavaScript bridge. The other major migration gaps concern formatting, import resolution/order, Node compatibility, and the enum prohibition. Rule identities and option schemas establish available candidates; they do not prove identical diagnostics, fixes, or coverage.

The repository enables **292 distinct rule IDs across its 14 reference profiles**. A rule can be enabled in one profile and disabled in another. These counts use the union, not the number applicable to every source file. See the [committed reference profiles](../../examples/README.md), [policy implementation](../../src/rules.js), and [formatting implementation](../../src/style-rules.js).

| Policy owner | Enabled IDs in any profile | Native identities or standard aliases | Unmatched IDs |
| --- | ---: | ---: | ---: |
| ESLint core | 86 | 83 | 3 |
| TypeScript ESLint | 85 | 84 | 1 |
| Stylistic | 66 | 0 | 66 |
| import-x | 12 | 8 | 4 |
| Node (`n`) | 10 | 4 | 6 |
| Unicorn | 32 | 31 | 1 |
| ESLint Comments | 1 | 0 | 1 |
| **Total** | **292** | **210** | **82** |

The 210 count maps core IDs into Oxlint's ESLint namespace, `@typescript-eslint/*` into `typescript/*`, and `import-x/*` into `import/*`. It also includes the standard native equivalents for TypeScript's extensions of `no-empty-function`, `no-redeclare`, `no-shadow`, `no-unused-expressions`, `no-unused-vars`, and `no-use-before-define`. It deliberately does not count different-owner approximate replacements as exact matches. The release-specific source was the `configuration_schema.json` distributed in the [Oxlint 1.87.0 tarball](https://registry.npmjs.org/oxlint/-/oxlint-1.87.0.tgz); the current [official rule catalog](https://oxc.rs/docs/guide/usage/linter/rules.html) explains the implementations.

## Missing native identities and their policy impact

| Current rule(s) | Impact of removing the current owner |
| --- | --- |
| `@typescript-eslint/naming-convention` | No native counterpart for configured camelCase/PascalCase/UPPER_CASE, interface `^I[A-Z]` prefix rejection, underscore rules, and selector-specific exemptions. `IFoo` is rejected; `Invoice` is permitted. Native `id-match` is not equivalent. The dedicated syntactic port below is a recovery candidate for these current options. |
| All 66 enabled `@stylistic/*` rules | Native Oxlint does not implement this formatting policy. It includes two-space indentation, single quotes, semicolons, Stroustrup braces, trailing commas, TypeScript member/type spacing, and JSX layout. A separate formatter would require a policy comparison and a change to ADR 0003. |
| `import-x/no-unresolved` | Loses this package's import-resolution diagnostics using the consuming project's TypeScript resolver settings. |
| `import-x/no-extraneous-dependencies` | Loses dependency-manifest checks; the policy currently permits development dependencies. |
| `import-x/no-useless-path-segments` | Loses import-path simplification checks. |
| `import-x/order` | Loses configured import groups, alphabetical ordering, blank-line groups, and named-import ordering. |
| `n/no-deprecated-api` | Loses the Node API deprecation policy. |
| `n/no-unsupported-features/es-builtins`, `n/no-unsupported-features/node-builtins` | Loses checks against the package's application target, Node 24. Parsing newer syntax or using a newer lint runtime does not replace application-runtime API compatibility checks. |
| `n/process-exit-as-throw` | Loses this rule's handling of `process.exit()` in control-flow/code-path analysis. |
| `n/prefer-node-protocol` | Different-owner native candidate exists: `unicorn/prefer-node-protocol`. The common requirement to use `node:` is available; compare supported import forms and fixes before declaring parity. |
| `n/no-process-exit` | Partial native candidate exists: `unicorn/no-process-exit`. Oxlint's documented Unicorn rule exempts files with a Node shebang, while the current Node rule bans `process.exit()` there too. |
| `unicorn/no-unnecessary-polyfills` | Loses unnecessary-polyfill checks. |
| `no-restricted-syntax` | Its current TypeScript selector bans **all enum declarations**. This is a native policy gap, but the custom JavaScript wrapper probe below successfully recovers this selector check. |
| `no-dupe-args`, `no-octal` | The migration tool describes these as superseded by strict-mode parsing. The native parser accepted both duplicate parameters and legacy octal in the non-strict CommonJS probe, so removing these rules loses coverage in that profile. |
| `@eslint-community/eslint-comments/require-description` | Loses mandatory explanatory descriptions for selected disable directives. Reporting unused directives is a different check. Retention through the JavaScript bridge encountered an observed reporting compatibility defect in both probes below. |

The naming implementation is explicitly unchecked in [tsgolint's implemented-rule checklist](https://github.com/oxc-project/tsgolint#implemented-rules). `prefer-destructuring` is also unchecked, but this package does not enable it, so its absence is not a loss here. Upstream's summary counts disagree with its checklist section; this assessment uses the actual enabled rule names rather than its blanket coverage fraction. See the native [Node protocol rule](https://oxc.rs/docs/guide/usage/linter/rules/unicorn/prefer-node-protocol) and [process-exit rule](https://oxc.rs/docs/guide/usage/linter/rules/unicorn/no-process-exit) for the alternative-owner distinctions.

## What remains available for TypeScript

The 48 enabled type-aware rules include floating/misused promises, unsafe `any` operations, strict boolean expressions, exhaustive switches, unbound methods, throw restrictions, nullish/optional-chain preferences, and unnecessary type operations. Their names appear in [tsgolint's implementation checklist](https://github.com/oxc-project/tsgolint#implemented-rules). These rules require `oxlint-tsgolint` and type-aware mode; installing plain Oxlint does not establish this coverage. [Type-aware setup](https://oxc.rs/docs/guide/usage/linter/type-aware.html).

There is **no identified loss of the explicitly configured option keys** for these important rules in the released Oxlint schema. Live official documentation corroborates their supported values:

| Rule | Current configured behavior available in Oxlint |
| --- | --- |
| [no-floating-promises](https://oxc.rs/docs/guide/usage/linter/rules/typescript/no-floating-promises.html) | `ignoreVoid: false`, `ignoreIIFE: false`, `checkThenables: true`. Defaults must not replace these strict settings. |
| [no-misused-promises](https://oxc.rs/docs/guide/usage/linter/rules/typescript/no-misused-promises.html) | `checksConditionals`, `checksSpreads`, and `checksVoidReturn` all `true`. |
| [no-unnecessary-condition](https://oxc.rs/docs/guide/usage/linter/rules/typescript/no-unnecessary-condition.html) | `checkTypePredicates: false`. |
| [only-throw-error](https://oxc.rs/docs/guide/usage/linter/rules/typescript/only-throw-error.html) | `allowThrowingAny: false`, `allowThrowingUnknown: false`, `allowRethrowing: true`. |
| [restrict-plus-operands](https://oxc.rs/docs/guide/usage/linter/rules/typescript/restrict-plus-operands.html) | All five configured allowances are `false`. |
| [restrict-template-expressions](https://oxc.rs/docs/guide/usage/linter/rules/typescript/restrict-template-expressions.html) | All six configured allowances are `false`. |
| [return-await](https://oxc.rs/docs/guide/usage/linter/rules/typescript/return-await) | `always`. |
| [strict-boolean-expressions](https://oxc.rs/docs/guide/usage/linter/rules/typescript/strict-boolean-expressions.html) | All eight configured allowance keys exist, including permitting nullable objects while rejecting strings, numbers, nullable primitive types, nullable enums, and `any`. |
| [explicit-module-boundary-types](https://oxc.rs/docs/guide/usage/linter/rules/typescript/explicit-module-boundary-types) | Present since Oxlint 1.9.0. Both higher-order and direct-const-arrow exemptions can be disabled while typed-function-expression exemptions remain enabled. |
| [method-signature-style](https://oxc.rs/docs/guide/usage/linter/rules/typescript/method-signature-style) | Present since 1.68.0; supports the current `property` setting. **Its automatic fix is not implemented in Oxlint**, while the installed ESLint rule provides a code fix. Enforcement exists, but fix parity does not. |

The schema also contains all explicitly configured keys for `array-type`, `ban-ts-comment`, `consistent-type-assertions`, and `consistent-type-imports`. This was a key/value-schema inspection, not an exhaustive execution comparison. Defaults, diagnostic locations, edge cases, suggestions, and fixes remain separate verification work.

## JavaScript plugins can recover some gaps

Oxlint's ESLint-compatible JavaScript plugin API is **alpha**. It supports rule options, fixes, selectors, scope/code-path APIs, and source/token APIs. Stylistic is among the plugins upstream conformance-tests. Retaining selected JavaScript plugins can therefore recover formatting and other missing native policy candidates, but the exact versions, rule options, resolver behavior, and fixes used here still require execution tests. [Official plugin support and limits](https://oxc.rs/docs/guide/usage/linter/js-plugins.html).

The installed description rule also supports `additionalDirectives`, which can name non-ESLint comment directives. However, the probe below failed through Oxlint's bridge for both ESLint and Oxlint comments, so retaining the unmodified plugin is not a verified recovery path. [Description-rule options](https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/require-description.html).

That API explicitly excludes rules relying on TypeScript type information and custom parsers. It is not a general fallback for missing typed rules. This package's naming configuration does not use the `types` filter, so its semantic requirements are narrower than the full rule. However, the installed naming rule still requests TypeScript parser services and AST-to-TypeScript node maps. A probe using only the simpler variable/camelCase options failed before reporting the invalid identifier; the existing plugin cannot simply be loaded as a working replacement. [Naming rule's conditional type requirements](https://typescript-eslint.io/rules/naming-convention/); locally inspected `@typescript-eslint/eslint-plugin` 8.71.1 and its `getParserServices` utility.

Separately, the third-party **`@kevinmichaelchen/oxlint-plugin-naming-convention` 0.1.1** advertises a dedicated syntactic port. Its author lists the selectors, `const`/`destructured` modifiers, formats, underscore options, selector arrays, and custom regex used by this package. The advertised omission is `types`: such selectors never match. Our current naming policy has no `types` filter, so that omission does not itself exclude this policy; this is an inference from its README and our configuration. The author claims extensive upstream fixture comparison, but that is not independent verification of this repo's policy. The package introduces `effect-oxlint` and an Effect 4 release-candidate peer dependency. [Author-published package README](https://www.npmjs.com/package/%40kevinmichaelchen/oxlint-plugin-naming-convention).

The published 0.1.1 artifact's README, bundled source, manifest, and `INCOMPATIBILITIES.md` were also inspected. Its documented baseline is TypeScript ESLint 8.69, while this repo uses 8.71.1. Besides the missing `types` filter, it assumes ESNext/JavaScript-engine Unicode tables for `requiresQuotes`, approximates `unused` through Oxlint's scope manager, inherits Oxlint's earlier parser errors, and uses different JSON diagnostic column units for non-ASCII text. Our options select neither `types`, `requiresQuotes`, nor `unused`, so those modifier/filter omissions do not directly remove a configured check. Parser errors and diagnostic representation remain comparison considerations. [Pinned author-published artifact](https://registry.npmjs.org/@kevinmichaelchen/oxlint-plugin-naming-convention/-/oxlint-plugin-naming-convention-0.1.1.tgz).

Our exact naming policy permits leading underscores for variables/parameters, permits UPPER_CASE constants, requires PascalCase type-like names, and rejects interface names matching `^I[A-Z]`. It exempts property/method/accessor names, original destructured bindings, and enum members from format checks; renamed destructured aliases remain checked. Imports permit camelCase or PascalCase. Those syntactic options are represented by the dedicated port's schema and implementation. [Current naming configuration](../../src/rules.js).

The original TypeScript ESLint plugin's failed probe does **not** establish that this dedicated port fails. The port is a promising near-equivalent candidate for our current no-`types` policy; it has **not** been run against that policy here. Validate all configured selectors, exemptions, and regex behavior before calling it a complete replacement or calling naming conventions an unavoidable migration loss.

## Bounded execution probes

Oxlint 1.87.0 was also run on small isolated fixtures with default correctness rules disabled, enabling only the rule(s) under examination. These probes establish narrow behavior, not complete rule/profile parity:

| Probe | Observed result |
| --- | --- |
| Native `unicorn/no-process-exit` | Reported the regular file's call; accepted the same call in a Node-shebang file. Confirms the CLI exception. |
| Current TypeScript ESLint naming rule through the JavaScript bridge | Failed with missing TypeScript parser services on a variable/camelCase-only config. This fails even without the `types` option. |
| All 66 current Stylistic rules loaded through the bridge | Loaded successfully; reported the fixture's double quotes and missing semicolon. This supports retaining Stylistic, but does not exercise every rule, JSX/TS syntax, or fixes. |
| Representative Stylistic `--fix` run | First invocation changed double quotes to single quotes but still reported the missing semicolon and exited with failure; a second invocation added the semicolon and succeeded. These two fixes work in the fixture, but required two invocations; no general fix-parity conclusion follows. |
| Current ESLint `no-restricted-syntax` exposed as a custom JavaScript plugin with `TSEnumDeclaration` selector | Reported an enum declaration. The native enum-policy gap is recoverable in this narrowly tested wrapper. |
| Current description rule through the bridge, with `additionalDirectives` for Oxlint variants | Both undescribed ESLint and Oxlint comments failed with an out-of-range line/column `RangeError` during reporting. A compatibility fix or replacement rule would be needed. |
| Paired CommonJS fixture | Oxlint's native parser with no enabled lint rules accepted `function f(a, a) { return 010; }`. ESLint 10.12.0 with CommonJS source type and the current `no-dupe-args`/`no-octal` rules reported both on the identical fixture. Strict-mode parsing alone does not preserve these current checks. |

The probe results are local observations using the installed ESLint 10.12.0 and plugin versions from this repository and the pinned Oxlint binary. They are not upstream promises. No consumer project was migrated or changed.

## Profiles, defaults, and project integration

The migration catalog identifies five enabled native candidates as **nursery**: `import/export`, `eslint/no-undef`, `eslint/no-unreachable-loop`, `typescript/no-unnecessary-condition`, and `typescript/prefer-optional-chain`. Migration defaults can omit nursery candidates. Explicitly enable and review these rules; a converted config must be compared against the full current policy. Their existence does not make default-generated output complete.

Oxlint has pattern-based rule overrides, so test relaxations and declaration/syntax-only profiles have a configuration mechanism. The package also distinguishes ESM and CommonJS by extension and nearest package manifest, supports consumer overrides, and switches between typed and syntax-only paths. These behaviors require a factory/interface migration and coverage verification; a single flat list of matching rules is insufficient. Oxlint's type-aware/type-check switches are root-only settings. [Configuration](https://oxc.rs/docs/guide/usage/linter/config.html), [configuration reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html), [type-aware operation](https://oxc.rs/docs/guide/usage/linter/type-aware.html).

Specifically verify errors for unexpectedly out-of-project TypeScript files, monorepo/project-reference resolution, import aliases, declaration behavior, test exceptions, JSX/TSX, and CommonJS globals. The current policy requires unexpectedly excluded TypeScript files to fail instead of silently losing typed checks. No Oxlint parity for that fail-closed requirement has been established here. Oxlint's typed engine targets TypeScript 7 and requires dependent declaration outputs to be available in monorepos. [Type-aware guide](https://oxc.rs/docs/guide/usage/linter/type-aware.html).

## Reproduction and decision scope

### Accepted direction for naming

Following this audit, the user chose native `id-match` over adding a dedicated naming plugin and accepted reducing convention configurability where it helps align the ESLint and Oxlint policies. This is a planning decision; the executable rules above remain the audited original policy.

The starting candidate permits camelCase, PascalCase, UPPER_CASE, and a leading underscore without selector-specific casing or an interface-prefix restriction. A declaration-focused scope avoids requiring complete TypeScript naming coverage. Exact regex and scope remain implementation work.

Paired isolated probes with ESLint 10.12.0 and Oxlint 1.87.0 found that broad `id-match` checks reject TypeScript property signatures even with `properties: false`. With `onlyDeclarations: true`, both engines accepted those external schema names and reported an invalid variable and a declared-function parameter; ESLint additionally reported an invalid renamed destructured alias that Oxlint accepted with `ignoreDestructuring: true`. These are bounded observations, not complete parity. The ticket must document accepted differences and preserve external-schema usability. See the [Oxlint rule scope and known differences](https://oxc.rs/docs/guide/usage/linter/rules/eslint/id-match) and [ESLint rule options](https://eslint.org/docs/latest/rules/id-match).

Review other options individually. Convention simplifications are candidates; removing correctness checks just to increase native coverage is not an established decision. Exact engine and public-interface changes remain implementation work for the reviewed ticket plan.

### Accepted direction for style

The user subsequently chose **Oxlint + oxlint-tsgolint + @stylistic/eslint-plugin**, with style rules executed through the JavaScript plugin API and no Oxfmt. This preserves individually configurable style diagnostics and fixes in the lint command. Validate all current Stylistic settings across the reference profiles and record fix limitations before adopting the candidate; the probes above establish successful loading and representative behavior, not complete parity. See [ADR 0013](../adr/0013-use-stylistic-in-the-planned-oxlint-stack.md) and [draft tickets 1 and 2](../pre-v1-ticket-drafts.md).

### Accepted migration and naming direction

The user confirmed proceeding with tsgolint and selected GitHub `brandonramsey/lint` and npm `@brandonramsey/lint` as the project identities. [ADR 0014](../adr/0014-migrate-to-oxlint-and-lint-identities.md) records the implementation direction. The user approved the seven-ticket summary and the [tracking issues](../pre-v1-ticket-drafts.md) were submitted on October 8, 2026, covering actual engine/interface migration and the identity/publisher cutover. This audit still describes the original executable policy and bounded probes, not a completed migration.

### Audit procedure

1. Read every committed `examples/rules/*.mjs` profile; collect settings whose severity is enabled. Deduplicate IDs across profiles and retain all distinct settings and affected profiles.
2. Fetch the exact Oxlint release tarball from npm; inspect its shipped `configuration_schema.json`. Map standard namespace changes and the six TypeScript extension owners listed above.
3. Record unmatched identities separately from cross-owner approximate alternatives. Inspect the migration tool's nursery classifications; do not equate its default output with the full policy.
4. Compare configured option keys and values with the shipped schemas and owning official rule documentation. Compare typed names with tsgolint's actual implementation checklist.
5. Before migration, run paired lint/fix fixtures for each accepted replacement and run a final candidate against the consumer project. Include profile coverage and setup errors, not only a diagnostic total.

The audit and probes changed no implementation, package dependencies, lockfile, or lint configuration. They do not establish end-to-end behavior or performance parity. The subsequent planning work created the approved tracking issues; the technical evidence remains a rule identity/schema/source audit with the bounded execution probes above.

The accepted migration supersedes the planned engine/interface in [ADR 0007](../adr/0007-target-eslint-10-flat-config.md) and [ADR 0009](../adr/0009-export-default-config-and-factory-as-esm.md) when implemented. It must preserve or explicitly revise [ADR 0006's typed coverage requirement](../adr/0006-enable-typed-checks-by-default.md) and [ADR 0008's monorepo/reference support](../adr/0008-support-monorepos-and-project-references.md). The next concrete work is [issue #1's policy validation](https://github.com/brandonramsey/bramsey-eslint/issues/1), followed by implementation and identity cutover described in the approved tickets.
