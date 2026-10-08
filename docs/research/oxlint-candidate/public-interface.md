# Proposed Oxlint-native package interface

Proposal for [issue #2](https://github.com/brandonramsey/bramsey-eslint/issues/2), based on [candidate validation](README.md) and the [47 configuration checks](configuration-results.json). The implementation and published package remain unchanged. Coverage discovery, nearest-project resolution and canonical paths now have bounded executable prototypes. Native parser-mode compatibility follows [ADR 0016](../../adr/0016-use-native-parsing-with-package-aware-policy.md); production packaging and runner integration remain implementation work.

## Consumer configuration

Keep the ESM factory/default-export convenience while changing the returned value to one native Oxlint object. Author the factory, plugins and invocation code in TypeScript, compiling to published JavaScript and declarations. A Node-24 consumer can author `oxlint.config.ts`:

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

Use one explicit, canonical root configuration in the supported runner. Native automatic nested lookup replaces the selected policy rather than inheriting it, and direct nested operational options are rejected. `extends` is not an implicit package-policy merge. Canonicalize cwd, configuration location and selected file paths together; file patterns are relative to the configuration's directory. Require that directory to match `projectRoot`, or materialize the runner's effective config at the root before invoking it. Resolve relative factory patterns against that root, not a caller's unrelated working directory. Validate mismatches instead of leaking exemptions.

Resolve plugin specifiers from the compiled package location, using supported absolute specifiers where necessary. Packed installation must not import repository sources, temporary files or development-only modules. Keeping selected ESLint rule providers as explicit pinned runtime dependencies is compatible with Oxlint as the execution engine; it does not justify loading an ESLint parser/typed plugin or executing ESLint as a fallback. The `eslint/use-at-your-own-risk` rule-provider entry point is a maintenance risk: verify it at install/packed-test time or replace the small owned compatibility rules before shipping.

## Selected compatibility modules

1. A style plugin forwards the full pinned Stylistic rule set with its options.
2. A policy plugin exposes only the retained gap rules and injects resolver/runtime settings while preserving the bridge context prototype. The harness demonstrated that spreading context loses inherited properties; preserve getters and source services.
3. Export correctness needs a guarded graph solution. The Oxc child parser adapter is scoped to export-name traversal; its empty token list is not general parser compatibility or JSDoc/deprecation parity. Native Oxlint remains the main parser and tsgolint the typed engine. Explicit child extensions are required for TS graphs.
4. A coverage component warns when non-exempt TS has no configured membership. Validate configuration with the pinned compiler's `--build --dry` before expanding metadata using `--showConfig --project`; `--showConfig` alone silently recovers some malformed JSON. Follow references, including nonstandard filenames, and inherited include/exclude/files. Match tsgolint's nearest conventional-config, reference and ancestor search against parsed root inputs, not a union of every discovered project's files. A transitive import can be in the compiler program while still selecting inferred tsgolint coverage. Canonicalize paths and distinguish malformed configuration from inferred coverage. The [prototype](configuration-contracts.mjs) records metadata refresh, a solution root, ancestor selection and syntax-only exemptions; production discovery must cover the pinned resolver's full traversal and fallback behavior. Cache only within the root/invocation and refresh after relevant config/source changes. Emit a visible warning and continue typed checks per ADR 0015.
5. Require descriptions through an independent parsed-comment preflight using the existing ESLint Comments rule, including Oxlint disable directives. The [prototype](description-preflight.mjs) collects the rule's reports before native linting, so a disable comment cannot suppress the requirement. Emit valid locations, preserve unused-directive errors and blanket-disable rejection, and apply preflight to the same selected, non-ignored files as the runner. The direct rule bridge crashes on negative columns; clamping alone permits self-suppression. Required descriptions therefore belong to the package runner contract; stock Oxlint alone does not supply them.

Use one resolver per discovered project with nearest-directory selection, as in the existing factory, plus a fallback without tsconfig aliases for files without a project. The configuration prototype verifies conflicting workspace aliases through the actual Oxlint bridge, nonstandard resolver project filenames, custom extensions, independent roots, missing imports and symlink file inputs. Preserve consumer resolver settings when constructing each resolver; do not overwrite them with a hard-coded fixture resolver. An explicitly supplied project pattern that matches nothing is a setup error. Explicit `--tsconfig` and `resolverOptions.project` customize import resolution, not typed-project selection. Resolver project discovery must never suppress an inferred-coverage warning.

## Parser-mode compatibility decision

Oxlint 1.87.0 chooses `.js`/`.jsx`/`.ts`/`.tsx` parser mode from content, rather than the nearest package's `type` field; its override schema has no source-mode field. Native globals overrides preserve CommonJS/ESM global availability, and selected bridged policy rules can receive the package's policy settings, but neither changes native scope analysis. The [source evidence](configuration-contract-sources.md#source-mode-is-a-compatibility-boundary) and executable checks establish this boundary.

The measured example is an ambiguous `.js` file in an ESM package containing `this.eval('value')`: the configured ESM baseline emits no `no-eval` finding, while native script analysis reports it. A separate parser preflight cannot repair that difference. It also rejects ESM top-level return and CommonJS JSX exports that the current TypeScript parser accepts, introducing additional policy rather than preserving the baseline.

The maintainer approved native parsing plus package-aware globals/policy selection on October 8, 2026, with dedicated extensions authoritative and no promise of arbitrary parser/scope switching. [ADR 0016](../../adr/0016-use-native-parsing-with-package-aware-policy.md) records the decision. Document these limits on `commonjsFiles`/`moduleFiles` and user-supplied native rules. The configuration-contract research gate is resolved; issue #2 must implement the approved boundary without exporting an ignored parser option or adding an implicit ESLint engine fallback.

## One quality-and-style invocation

Provide a package `lint` executable around the native engine so coverage/preflight and fixes have one supported entry point. Plain lint forwards native diagnostics and exit status while adding the coverage warning if not supplied by the policy plugin. Keep warning-only exit zero unless the consumer explicitly requests warning failure; invalid configuration, missing engine/dependencies and typed-engine crashes remain failures.

For `lint --fix`, freeze the selected file set, run ordinary safe fixes, and repeat while files change. Compare content fingerprints, stop on unchanged content, fail with an actionable diagnostic on a repeated state or ten-pass ceiling, and retain a final no-fix result. Do not enable dangerous fixes implicitly or mask a plugin/engine failure by continuing passes. The demonstrated maximum is four modifying passes; ten is a proposed guard, not an observed universal convergence guarantee. Validate interacting fixes through the actual packed executable.

Advanced consumers may run stock Oxlint directly against the native object, receiving its ordinary fix behavior. Explain the package runner's repeated-fix semantics in usage documentation. Runtime files must not depend on a shell script; invoke the native engine portably from compiled TypeScript.

## Minimal package tests

The maintainer clarified on October 8, 2026 that permanent tests should verify this library exports what consumers need. Assume Oxlint and its shipped rules work. These research probes are migration evidence, not a permanent per-rule suite; do not port them wholesale into package tests.

Keep direct assertions and a small representative consumer:

1. Import the public factory, default export and public types from a clean packed installation. Check native config shape, exact required rule settings, engine options and packaged plugin exports/assets. Test the shipped declarations by type checking the public usage example.
2. Exercise the factory's own composition: root derivation, ignore extension, test/declaration/syntax-only exemptions and final consumer override precedence. Inspect returned settings rather than asking Oxlint to rediscover a rule's behavior. Group parallel cases in a small table where useful.
3. Test package-owned logic at its boundary: membership/reference discovery and warnings, resolver/project selection, path canonicalization, description preflight, and runner exit/fix-loop handling. Use minimal fixtures and injected engine results for orchestration; test a regression only when our adapter or composition owns the behavior.
4. Run one small packed-consumer smoke check to prove published configuration and plugin assets load and the supported runner executes. Retain a representative failure only where needed to prove our integration or exit-status handling. Do not add a positive/negative suite for each native, typed or Stylistic rule.

Implement the validated coverage discovery, required-description preflight, portable bounded fixing, nearest-project resolution, canonical paths and compiled plugin specifiers in issue #2, using the approved parser-mode decision above. Generated reference drift remains a separate artifact check. Test only supported Node/runtime boundaries in the release matrix. The published identity/cutover remains the responsibility of its separate ticket.
