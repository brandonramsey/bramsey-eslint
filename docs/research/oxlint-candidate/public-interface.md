# Proposed Oxlint-native package interface

Proposal for [issue #2](https://github.com/brandonramsey/bramsey-eslint/issues/2), based on [candidate validation](README.md) and the [47 configuration checks](configuration-results.json). The implementation and published package remain unchanged. Coverage discovery, nearest-project resolution and canonical paths now have bounded executable prototypes. Native parser-mode compatibility follows [ADR 0016](../../adr/0016-use-native-parsing-with-package-aware-policy.md); production configuration and plugin packaging remain implementation work. [ADR 0017](../../adr/0017-publish-configuration-and-plugins-without-a-runner.md) records the approved configuration-only boundary and accepted disable-description limitation.

## Consumer configuration

Keep the ESM factory/default-export convenience while changing the returned value to one native Oxlint object. Author the factory and plugins in TypeScript, compiling to published JavaScript and declarations. Require Oxlint as a peer dependency and bundle oxlint-tsgolint and all required plugin/provider packages. Consumers own execution; the library exports no lint executable or execution helper. A Node-24 consumer can author `oxlint.config.ts`:

```ts
import { createConfig } from '@brandonramsey/lint';

export default createConfig({
  projectRoot: import.meta.dirname,
  syntaxOnlyFiles: ['tools/**/*.ts'],
  overrides: [
    { files: ['generated/**/*.ts'], rules: { 'typescript/no-explicit-any': 'off' } },
  ],
});
```

This is proposed usage, not a currently available import. Export `ConfigOptions`, `createConfig` and the default object, typed with Oxlint's native config types. The default uses canonical `process.cwd()`; an explicit root must be absolute and canonicalized before deriving file patterns, project membership or resolver paths. Avoid a process-global cache shared by unrelated roots.

| Factory option | Native behavior / implementation requirement |
| --- | --- |
| `projectRoot` | Canonical root for config generation, project/reference discovery and package-mode selection |
| `syntaxOnlyFiles` | Final policy override disables the explicit 48 typed rules and inferred-coverage warning for matching TS; root `typeAware` remains enabled |
| `tests`, `testFiles` | Preserve standard/custom test patterns and existing relaxed rules; retain promise safety |
| `ignores` | Extend native `ignorePatterns`, preserving generated/build/dependency exclusions |
| `resolverOptions` | Preserve consumer resolver settings and nonstandard project names; derive absolute candidates relative to the selected root |
| `commonjsFiles`, `moduleFiles` | Approved contract: select package policy and Node globals for ambiguous extensions, with module patterns winning overlaps. Dedicated `.mjs`/`.mts` and `.cjs`/`.cts` extensions win. These options do not force native parser/scope mode; see the compatibility boundary below |
| `overrides` (new) | Append typed native overrides after package policy stages; consumer precedence is last. Accept native override fields only: `files`, `excludeFiles`, `rules`, `globals`, `env`, `plugins`, `jsPlugins`. Reject root-only `options`, per-file resolver `settings`, and ESLint `languageOptions` |

Root config must disable inherited default correctness categories, explicitly load native `typescript`, `import`, `node` and `unicorn` owners, enable exact retained settings, and load the packaged `style` and selected `policy` JavaScript plugin modules. Preserve existing generated/test/declaration/package-mode stages in deterministic order. The experiment's `results.json.candidate` is a concrete shape example; its sanitized fixture paths and relative helper modules are not a publishable artifact.

Set root `options.typeAware: true` and `reportUnusedDisableDirectives: 'error'`. Typed lint is not a replacement for the consumer's compiler script; avoid implicitly adding `typeCheck` diagnostics to the lint policy. Per-file syntax-only behavior is expressed through rule overrides, not unsupported per-file `typeAware` switches.

Retain ESLint's implicit `no-inner-declarations` default explicitly as `['error', 'functions', { blockScopedFunctions: 'allow' }]`. The pinned native rule reports block functions in an explicit module when that object is omitted; the paired configuration probe demonstrates the correction. This still evaluates strictness using native scope analysis.

Document a consumer-owned invocation using one explicit, canonical root configuration. Native automatic nested lookup replaces the selected policy rather than inheriting it, and direct nested operational options are rejected. `extends` is not an implicit package-policy merge. File patterns are relative to the configuration's directory, so consumers must align canonical cwd, configuration location and selected file paths with `projectRoot`; the factory cannot inspect or enforce their invocation. Canonicalize paths under the package's control and resolve relative factory patterns against that root. Document mismatched-directory and alternate-path risks without promising runner-level protection.

Resolve plugin specifiers from the compiled package location, using supported absolute specifiers where necessary. Packed installation must not import repository sources, temporary files or development-only modules. Keeping selected ESLint rule providers as explicit pinned runtime dependencies is compatible with Oxlint as the execution engine; it does not justify loading an ESLint parser/typed plugin or executing ESLint as a fallback. The `eslint/use-at-your-own-risk` rule-provider entry point is a maintenance risk: verify it at install/packed-test time or replace the small owned compatibility rules before shipping.

## Selected compatibility modules

1. A style plugin forwards the full pinned Stylistic rule set with its options.
2. A policy plugin exposes only the retained gap rules and injects resolver/runtime settings while preserving the bridge context prototype. The harness demonstrated that spreading context loses inherited properties; preserve getters and source services.
3. Export correctness needs a guarded graph solution. The Oxc child parser adapter is scoped to export-name traversal; its empty token list is not general parser compatibility or JSDoc/deprecation parity. Native Oxlint remains the main parser and tsgolint the typed engine. Explicit child extensions are required for TS graphs.
4. A bundled coverage rule warns when non-exempt TS has no configured membership. Validate configuration with the pinned compiler's `--build --dry` before expanding metadata using `--showConfig --project`; `--showConfig` alone silently recovers some malformed JSON. Follow references, including nonstandard filenames, and inherited include/exclude/files. Match tsgolint's nearest conventional-config, reference and ancestor search against parsed root inputs, not a union of every discovered project's files. A transitive import can be in the compiler program while still selecting inferred tsgolint coverage. Canonicalize paths and distinguish malformed configuration from inferred coverage. The [prototype](configuration-contracts.mjs) records metadata refresh, a solution root, ancestor selection and syntax-only exemptions; production discovery must cover the pinned resolver's full traversal and fallback behavior. Scope caches to the selected root and lint lifecycle, refresh after relevant config/source changes, and verify lifecycle behavior under ordinary consumer-owned Oxlint execution. Emit a warning through the configured rule and continue typed checks per ADR 0015; consumers control warning-failure flags and overrides.
5. Disable-comment explanations are an accepted configuration-only limitation under ADR 0017. The direct rule bridge crashes on negative columns; clamping permits self-suppression. The independent [preflight prototype](description-preflight.mjs) remains historical evidence and will not ship as an execution obligation. Retain native unused-directive errors and blanket-disable rejection, and document that explanations are not enforced.

Use one resolver per discovered project with nearest-directory selection, as in the existing factory, plus a fallback without tsconfig aliases for files without a project. The configuration prototype verifies conflicting workspace aliases through the actual Oxlint bridge, nonstandard resolver project filenames, custom extensions, independent roots, missing imports and symlink file inputs. Preserve consumer resolver settings when constructing each resolver; do not overwrite them with a hard-coded fixture resolver. An explicitly supplied project pattern that matches nothing is a setup error. Explicit `--tsconfig` and `resolverOptions.project` customize import resolution, not typed-project selection. Resolver project discovery must never suppress an inferred-coverage warning.

## Parser-mode compatibility decision

Oxlint 1.87.0 chooses `.js`/`.jsx`/`.ts`/`.tsx` parser mode from content, rather than the nearest package's `type` field; its override schema has no source-mode field. Native globals overrides preserve CommonJS/ESM global availability, and selected bridged policy rules can receive the package's policy settings, but neither changes native scope analysis. The [source evidence](configuration-contract-sources.md#source-mode-is-a-compatibility-boundary) and executable checks establish this boundary.

The measured example is an ambiguous `.js` file in an ESM package containing `this.eval('value')`: the configured ESM baseline emits no `no-eval` finding, while native script analysis reports it. A separate parser preflight cannot repair that difference. It also rejects ESM top-level return and CommonJS JSX exports that the current TypeScript parser accepts, introducing additional policy rather than preserving the baseline.

The maintainer approved native parsing plus package-aware globals/policy selection on October 8, 2026, with dedicated extensions authoritative and no promise of arbitrary parser/scope switching. [ADR 0016](../../adr/0016-use-native-parsing-with-package-aware-policy.md) records the decision. Document these limits on `commonjsFiles`/`moduleFiles` and user-supplied native rules. The configuration-contract research gate is resolved; issue #2 must implement the approved boundary without exporting an ignored parser option or adding an implicit ESLint engine fallback.

## Consumer-owned execution

Consumers invoke their peer-installed Oxlint using this package's native configuration and bundled plugins. They select files, manage working/configuration directories, choose warning-failure flags, and handle diagnostics and exit status. Type-aware checks and the configured coverage-warning rule apply through the exported configuration; strict compiler diagnostics remain a separate consumer command.

Consumers also own fixing. The candidate demonstrated overlapping Stylistic fixes requiring up to four modifying Oxlint invocations, followed by verification. Document this observed behavior without promising that one invocation reproduces the former ESLint output, or claiming a universal convergence bound. The package does not provide repeated fixing, cycle detection or fix-loop exit handling.

Verify bundled dependencies, public export targets and plugin specifiers from the package's modules, metadata and actual packed contents. Consumers should not need separate direct installations of plugins or repository-only execution code. No lint executable, independent description preflight or execution helper is part of the public API.

## Minimal package tests

The complete generated rule reference must also produce an editable, drop-in Oxlint configuration example per [ADR 0004's clarification](../../adr/0004-exhaustive-rule-reference.md#oxlint-example-requirement--october-8-2026). Its unedited effective settings must match this package's normal defaults across profiles, including disabled rules, options and exemptions. Load plugins through public exports and derive paths for the consumer rather than serializing fixture roots. Verify settings equivalence and generation drift directly; users then customize explicit rule entries in the generated file.

The maintainer clarified on October 8, 2026 that permanent tests should cover only this library's public surface. Assume Oxlint and upstream plugins work. These research probes are migration evidence, not a permanent behavior suite; do not port them into package tests. The earlier consumer smoke check is also removed by the narrowed testing scope in ADR 0017.

Keep direct public-contract assertions:

1. Import built public modules and typecheck a minimal public usage example against generated declarations. Inspect packed contents and metadata to verify export targets, plugin assets/specifiers, the Oxlint peer and bundled dependency declarations. Do not install a temporary consumer or invoke Oxlint as a test.
2. Exercise the factory's own composition: root derivation, ignore extension, test/declaration/syntax-only exemptions and final consumer override precedence. Inspect returned settings rather than asking Oxlint to rediscover a rule's behavior. Group parallel cases in a small table where useful.
3. Verify bundled plugin rule exports and the configuration/options supplied to them, including resolver customization, coverage-warning settings and exemptions. Keep assertions at the public configuration/plugin boundary; do not build internal graph, resolver or lint-lifecycle regression suites.
4. Verify the generated editable example matches default effective settings across profiles and check generation drift. Compare configuration data directly; do not lint positive/negative source fixtures or exercise upstream rules/fixes.

Implement coverage discovery through a bundled warning rule, nearest-project resolution, guarded export traversal, canonical paths and compiled plugin specifiers in issue #2, using the approved parser-mode decision above. Accept unenforced disable descriptions and consumer-owned fixing per ADR 0017. Verify the public package contract within supported runtime/type boundaries; retain research compatibility evidence separately from permanent tests. The published identity/cutover remains the responsibility of its separate ticket.
