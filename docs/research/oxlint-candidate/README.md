# Oxlint candidate validation

Coverage scope update, October 8, 2026: [ADR 0018](../../adr/0018-use-native-typed-project-coverage.md) accepts native Oxlint/tsgolint behavior and withdraws the custom coverage warning and compiler-inspection process. The recorded coverage probes below are historical evidence and must not be implemented as package requirements.

Scope revision, October 8, 2026: [ADR 0017](../../adr/0017-publish-configuration-and-plugins-without-a-runner.md) limits the package to configuration and bundled plugins, with Oxlint as a peer dependency. Runner/preflight/fix-loop requirements and broader permanent-test recommendations below describe the earlier proposal and are superseded; unenforced disable-comment explanations are an accepted limitation. Permanent tests cover only the public package surface and generated-example equivalence/drift, with no consumer execution harness or lint-engine behavior tests. The recorded experiments remain historical evidence. The current implementation proposal is [public-interface.md](public-interface.md).

Local evidence for [issue #1](https://github.com/brandonramsey/bramsey-eslint/issues/1), checked October 8, 2026. This is an executable migration experiment; the published package and current implementation still use ESLint. Required descriptions and export-graph recovery now have working, bounded prototypes. Production factory/runner and packed exports remain issue #2 work.

## Result and evidence boundaries

The pinned candidate runs all 66 configured Stylistic checks and all 48 configured type-aware checks. All 14 existing reference profiles accept their neutral fixtures. The experiment retains the import, Node runtime, enum and non-strict CommonJS checks through selected JavaScript rules. Native rule-name matches alone were insufficient: native `import/export` missed conflicting star exports.

The [raw results](results.json) contain diagnostics, paired fixes, rule mapping, native configuration, environment, complete toolchain and timings. [Upstream research](../oxlint-candidate-upstream.md) supplies primary-source explanations. The [earlier inventory](../oxlint-rule-coverage.md) is historical evidence; the executable results here supersede its untested recovery candidates. No consumer repository, package dependency or publication identity was changed.

| Area | Verified outcome | Limit |
| --- | --- | --- |
| Stylistic | 66/66 isolated positive probes report in both engines; 66/66 final fixed outputs match; every fixture stabilizes | Positive examples and selected combined fixes do not establish every AST edge case |
| First Stylistic fix | 65/66 first-invocation outputs match ESLint | JSX one-expression-per-line needs another modifying invocation |
| Combined fixes | Quote/semicolon/import ordering, type imports and JSX layout stabilize and match ESLint | Respectively 2, 1 and 4 modifying Oxlint invocations, followed by an unchanged verification invocation |
| Type-aware checks | 48/48 positive probes report through tsgolint | Diagnostic wording, locations, suggestions and all fixes are not equivalent by assumption |
| Typed options | Both engines retain nullable-object and rethrow exceptions, necessary indexed-undefined checks, async-IIFE rejection and custom thenable rejection | Five controls supplement the 48 positive probes |
| Reference profiles | All 14 neutral profile probes exit successfully; JSX and TSX integration fixtures also pass | This tests selected input behavior rather than reproducing ESLint's entire resolved-config API |
| Test/declaration exceptions | Test `any`/assertions are allowed; test floating promises still fail; declarations retain `no-explicit-any` | Preserve every existing exemption in implementation and generated references |
| TypeScript coverage | Excluded valid TS warns and exits successfully; excluded floating promise warns and fails; explicit syntax-only TS skips both checks and warnings | Prototype membership uses three known fixture projects; production discovery still needs implementation |
| Resolution/references | Path alias, workspace source and built declaration resolve; deleting the required declaration output produces `no-unresolved`; restoring it restores resolution | tsgolint can redirect a reference to source, so typed success alone cannot validate required declaration builds |
| Mode/overrides | Package/extension/explicit-pattern globals and final consumer rule precedence pass; native parsing differs from configured source mode | Native parsing with package-aware policy was approved in ADR 0016; arbitrary forced parser/scope modes are outside that contract |

## Exact toolchain and TypeScript selection

The candidate uses Oxlint 1.87.0, oxlint-tsgolint 7.0.2003, TypeScript 7.0.2, Oxc parser 0.153.0, Stylistic 5.10.0, import-x 4.17.1, TypeScript resolver 4.4.5, Node plugin 18.4.1, Unicorn 77.0.0, ESLint Comments 4.8.1 and ESLint 10.12.0. Exact dependencies and integrity hashes are in [toolchain.json](toolchain.json) and [toolchain-lock.json](toolchain-lock.json). Node 24.21.0 on macOS arm64 ran the experiment.

Registry metadata selected stable TypeScript 7.0.2 on the validation date. The isolated candidate dependency tree contains that version, including the Node plugin's deduplicated dependency. A clean fixture `tsc --build` succeeds before deliberate invalid inputs are added. Both engines receive the same TS7-compatible fixture snapshot: removed `baseUrl`/`ignoreDeprecations`, explicit relative NodeNext alias targets, isolated declaration output, and minimal JSX declarations.

The baseline is the existing package with typescript-eslint 8.71.1 and TypeScript 6.0.3. Its ceiling is not a candidate runtime dependency. Candidate plugins load only from the isolated toolchain; the ESLint dependency supplies selected rule implementations and child `SourceCode`, while Oxlint executes linting. No typed ESLint rule or TypeScript ESLint parser is loaded by the candidate. There is no identified single dependency family blocking 7.0.2 in the exercised stack.

tsgolint embeds its own TypeScript-Go revision: upgrading consumer `typescript` alone does not upgrade the typed engine. Future compatibility checks must compare the stable compiler with the tsgolint target and the complete pinned plugin stack. Alert on the specific blocking family when only one prevents an upgrade; do not infer universal grammar compatibility from these fixtures.

## Rule mapping and option decisions

The 292 original IDs are mapped individually in `results.json.mapping`: 209 native identities/standard aliases, 66 Stylistic bridge rules, one simplified naming rule, 14 selected JavaScript rules (including the guarded export adapter), one required-description preflight, and one omitted inactive setting. This is a mapping count, not a count of universally equivalent implementations.

Selected gap owners are import-x resolution/dependency/path/order/export rules; Node protocol, exit, deprecation and built-in runtime rules; Unicorn polyfill checks; ESLint duplicate parameters, octal and enum selector; and required descriptions through an independent preflight. Keep these explicit rather than relying on engine presets. The prior inventory's 210 native matches falls to 209 because the export rule's runtime graph gap requires another owner.

| Configured convention/options | Candidate disposition |
| --- | --- |
| Every configured Stylistic setting | Retain all 66 exact settings; namespace changes to `style/*` |
| Role-specific naming and interface I-prefix prohibition | Replace with the approved shared pattern and declaration-focused native `id-match` |
| TypeScript `array-type: array-simple` | Retain |
| TS comment prohibitions and described `ts-expect-error` minimum length 3 | Retain |
| Class literal properties as fields | Retain |
| Constructor-side generic placement | Retain |
| Indexed objects as `Record` | Retain |
| Type assertions using `as`, with object/array literal assertions forbidden | Retain, with existing test exemptions |
| Type definitions as aliases | Retain, with existing declaration exemption |
| Separate type imports and top-level type specifiers | Retain both rules; combined fixing probe stabilizes |
| Explicit boundary flags for higher-order functions/direct const arrows/typed expressions | Retain explicit false/false/true values, not native defaults |
| Property method signatures | Retain diagnostics; native fix unavailable; variance implications mean this is not simply cosmetic |
| Kebab-case filenames | Retain |
| Import duplicate inline preference | Translate `prefer-inline: false` to `preferInline: false` |
| Import groups, blank lines, alphabetization, named ordering, unassigned-import option | Retain original import-x settings through the bridge |
| Import case sensitivity, CommonJS resolution, dev dependencies | Retain original settings; missing-import and undeclared dependency probes exercise the retained owners |
| Core conditional assignment, equality, braces, variable order and destructuring | Retain configured options |
| Inner declarations | Explicitly supply `functions` and `blockScopedFunctions: allow` to retain the baseline's implicit option; native parser/scope differences remain a separate compatibility decision |
| Complexity 10, depth 4, parameters 4 | Retain production settings and test exemptions |
| Node application target | Retain `>=24.0.0`, including JS runtime/deprecation checks |
| Disable-comment descriptions | Require through the package runner's independent preflight, reusing the existing rule; retain native blanket/unused checks |

All configured typed strictness objects remain explicit: floating promises (`ignoreVoid: false`, `ignoreIIFE: false`, `checkThenables: true`), misused promises, unsafe operations, throwing any/unknown versus rethrows, plus/template primitives, `return-await: always`, and strict boolean exceptions. The [upstream option review](../oxlint-candidate-upstream.md#policy-option-and-gap-decisions) and raw native configuration record the choices; no convention simplification authorizes weakening promise or unsafe-value checks.

Five policy IDs correspond to nursery rules in the pinned engine: `import/export`, `eslint/no-undef`, `eslint/no-unreachable-loop`, `typescript/no-unnecessary-condition`, and `typescript/prefer-optional-chain`. Enable their intended owners explicitly; export correctness uses the guarded policy owner instead of native `import/export`. Disable native `no-undef` on TS as before. The condition rule has no automatic fix, and optional-chain fixing is classified dangerous; ordinary fixes must not opt into dangerous fixes implicitly.

## Simplified naming scope

The shared ASCII pattern is:

```text
^_?(?:[a-z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)$
```

Use `onlyDeclarations: true`, `properties: false`, `ignoreDestructuring: true`. Paired probes compare ESLint's `id-match` with the same settings to native `id-match`, rather than misrepresenting the old selector-based naming rule as equivalent.

| Identifier category | Native observed scope |
| --- | --- |
| Variables and parameters | Invalid snake-case names reported; camelCase/PascalCase/UPPER_CASE and a single leading underscore accepted |
| Imports | Invalid imported binding reported |
| Type alias names | Not checked in this declaration-focused mode |
| Object/type/class members | Exempt, retaining external-schema usability |
| Original destructured binding | Exempt |
| Renamed destructured alias | Exempt natively; ESLint `id-match` reports the invalid alias on the paired fixture |
| `IFoo` interface | Accepted; I-prefix prohibition intentionally removed |

The type/alias scope losses are explicit consequences of the native declaration-focused choice. Do not silently broaden the scope: the earlier broader probe rejected TS property signatures despite `properties: false`.

## Compatibility remedies and implementation gates

1. **Required descriptions:** the original rule detects missing explanations but reports at column `-1`, which crashes the direct bridge on the first line. A clamped bridge avoids the crash but permits self-suppression; this was reproduced. The [independent preflight](description-preflight.mjs) reuses the same rule against parsed Oxc comments, collecting unsuppressible diagnostics with valid locations. All eight [focused cases](description-results.json) pass, covering described/undescribed, ESLint/Oxlint directives, inline/next-line, string/template lookalikes, Unicode/CRLF and self-suppression. The full candidate composes those errors with native diagnostics. This preserves the maintainer's clarified requirement; descriptions are not optional. Production integration must select the same non-ignored files as native lint and surface preflight errors through the runner. Stock Oxlint alone does not enforce descriptions.
2. **Export graphs:** native `import/export` misses conflicting star names, and original import-x's recursive traversal crashes on cycles. The [bounded Oxc parser](export-parser.mjs) supplies child ASTs; the [guarded graph adapter](export-graph.mjs) preserves original local-export listeners and replaces star traversal. All 27 [focused fixtures](export-candidate-results.json) pass, including cycles, distinct/identical bindings, namespaces, explicit overrides, default-only stars, TS/MTS/type-only exports, overloads and invalid children. These cases demonstrate the owned compatibility remedy, not universal upstream equivalence. The binding/cycle approach follows the [ECMAScript ResolveExport algorithm](https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#sec-resolveexport). Original baseline defects remain recorded in the paired results.
3. **Single-command fixes:** stock Oxlint needs several invocations for demonstrated overlapping fixes. The package runner should bound repeated passes, detect unchanged output/cycles, preserve execution failures, and report the final diagnostics. Until implemented, one stock `--fix` invocation does not promise the current ESLint output.
4. **Coverage discovery:** ordinary type-aware mode uses inferred programs. The [configuration prototype](configuration-contracts.mjs) now discovers conventional projects and references, expands inherited metadata, and selects configured root inputs using nearest/reference/ancestor eligibility. It verifies refresh, malformed configuration failure, nonstandard references, and the difference between transitive program inclusion and tsgolint selection. `--showConfig` silently accepts some malformed JSON, so validate first using the compiler's dry build. Implement this discovery in the production runner; do not ship the original harness's hard-coded three-project list.
5. **Path canonicalization:** on macOS, an explicit config using `/var/...` while working under `/private/var/...` leaked typed checks into a syntax-only override; matching canonical paths respected it. The [focused results](path-probe-results.json) record the spellings on the same fixture. Canonicalize project/config paths in the factory and runner.
6. **Configuration contracts:** [47 focused checks](configuration-results.json) pass for discovery, warnings and retained typed safety, syntax-only/declaration exemptions, conflicting workspace aliases through the bridge, custom resolver filenames/extensions, independent roots, canonical paths, native overrides and package/pattern globals. Native parser/scope modes cannot be forced per-file. The maintainer approved native parsing with package-aware policy in [ADR 0016](../../adr/0016-use-native-parsing-with-package-aware-policy.md), resolving #1's remaining mode decision. Source evidence is in [configuration-contract-sources.md](configuration-contract-sources.md); the concrete implementation contract is in [public-interface.md](public-interface.md).
7. **Public package contracts:** compiled plugin resolution, production runner integration, packed exports/assets and minimum-supported Node remain issue #2/release-matrix obligations. These research probes do not establish packaging compatibility.

`n/process-exit-as-throw` is already `meta.supported: false` under the pinned ESLint 10 baseline and returns no listeners. Omitting that inactive setting in implementation does not remove observed behavior; retaining its name would misleadingly claim code-path handling. The actual `n/no-process-exit` ban remains, including shebang scripts.

## Native public interface proposal

The concrete factory, configuration shape, runner responsibilities and implementation gates are in [public-interface.md](public-interface.md). Treat that file as a proposal for issue #2, not an implemented API. The implementation ticket must integrate the demonstrated remedies into the public package before shipment.

## Timing method

Both complete CLI engines lint the same 14 neutral reference files in fresh processes. Oxlint uses one worker. Its timing includes Stylistic, selected gap plugins, child-parser loading, resolver setup, and project-membership inspection. Four alternating paired runs include a first warm-up excluded from the median. Environment and every measurement are in `results.json.timings`.

The latest recorded medians are summarized in [timing-summary.json](timing-summary.json). This small fixture emphasizes startup and configuration costs; it is not a consumer performance prediction. Timing an invalid-input candidate with crashes would not establish successful lint throughput, so intentional failures are excluded from the timing file list.

## Reproduce

Run from this repository with its existing development dependencies installed. The following is fish syntax; it installs only into a new temporary directory. The harness retains its generated fixture project for inspection and rewrites local `results.json`.

```fish
set tools (mktemp -d /private/tmp/bramsey-oxlint-tools.XXXXXX)
cp docs/research/oxlint-candidate/toolchain.json $tools/package.json
cp docs/research/oxlint-candidate/toolchain-lock.json $tools/package-lock.json
npm ci --prefix $tools --ignore-scripts --no-audit --no-fund
node docs/research/oxlint-candidate/validate.mjs $tools
node docs/research/oxlint-candidate/configuration-contracts.mjs $tools
```

`validate.mjs` records evidence even when a candidate deliberately fails; its own exit status is not an all-green parity gate. Inspect recorded diagnostics, `exports.parity`, and retained blockers. Intentional typed violations added after the clean build make the later compiler run fail by design.

`configuration-contracts.mjs` records the remaining configuration evidence separately and fails if its bounded assertions fail. Passing the native parser boundary observation records a known difference; it does not assert mode parity or constitute maintainer approval. These scripts use isolated temporary projects and the pinned toolchain, leaving the published package unchanged.

## Permanent testing scope

The maintainer clarified on October 8, 2026 that permanent tests should stay simple and prove this library exports what consumers need. Assume Oxlint works. Keep the paired per-rule probes here as historical migration experiments; do not carry them into the ordinary test suite. Verify exports, required settings, factory composition and packaged assets directly, with small tests for package-owned coverage/preflight/graph/runner logic and one minimal packed-consumer integration check. See the [minimal package test plan](public-interface.md#minimal-package-tests).
