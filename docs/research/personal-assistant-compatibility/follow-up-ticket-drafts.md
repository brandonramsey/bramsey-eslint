# Package follow-up draft and deferred consumer notes

Prepared from [issue #6's assessment](README.md). **No GitHub submission or consumer implementation is authorized by this document.** Section 1 records the package defect resolved by the authorized local fix; it is no longer awaiting issue publication.

On October 9, 2026, the user deferred personal-assistant-project issues until after installing `@brandonramsey/lint@1.0.0` and retained responsibility for creating those issues. Sections 2–5 are reference notes for that later work, not tickets awaiting publication. Consumer policy violations and consumer issue creation are not prerequisites for the lint package's v1 release. The package declaration defect has been resolved and [independently verified](declaration-fix.md).

## 1. Make packed public declarations independent of undeclared provider types

Repository: `brandonramsey/lint`. Origin: #6. Status: resolved locally on October 9, 2026; all criteria below were verified in the [declaration-fix follow-up](declaration-fix.md). No issue was created.

### Problem

An independent installation of `@brandonramsey/lint@0.2.0` exposes a resolver declaration graph that reaches `eslint-import-context@0.1.9`. Its undeclared utils import fails; its type-fest import resolves the consumer's hoisted 0.21.3, while the candidate's declared 5.10.0 is nested elsewhere. The same three errors occur with strict TypeScript 7.0.2 and 6.0.3. Repository provider availability masks this consumer integration failure.

### Acceptance criteria

- [x] Resolve the public declaration dependency boundary without depending on consumer hoisting, optional undeclared types or `skipLibCheck`.
- [x] Preserve the public factory/options contract. Prefer keeping private provider types behind the package boundary; if adding a compiler-dependent family, explicitly reassess its TypeScript ceiling before choosing it.
- [x] Repack and repeat the isolated strict declaration assessment against the consumer's existing Jest dependency graph, with all required dependencies supplied by the package's public metadata.
- [x] Retest the intended compiler support boundaries, including the consumer's TypeScript 7.0.2, and revise support claims according to evidence.
- [x] Keep permanent regression coverage within ADR 0017's public declarations/metadata surface; this draft does not request a permanent consumer-execution harness.

Evidence: [TS7 errors](evidence/compiler-public-ts7.stdout), [TS6 errors](evidence/compiler-public-ts6.stdout), [fixture/config](README.md#reproduction-and-next-work), [dependency graph](toolchain.md#actual-public-declaration-blocker).

## 2. Handle CLI promise failures through explicit unknown error boundaries

Project: `personal-assistant-project`. Priority: P1. Deferred until after the user installs v1.0.0. Issue creation and implementation owner: user; assistant provides guidance/review/debugging.

### Problem

`scripts/demo-tool-requests.ts:11` leaves a `Promise<void>` unhandled. Three demo catch callbacks infer unsafe error types; `scripts/demo-tool-exchange.ts:28` passes the error directly to a string logger. The current 20 tests pass but do not establish all rejected-promise paths.

### Later work to consider

- [ ] User implements awaited/handled completion for the tool-request entrypoint with deliberate nonzero failure status.
- [ ] Narrow catch callback values from `unknown`, producing intentional string diagnostics and retaining useful error context.
- [ ] Resolve the applicable floating-promise, catch-variable, unsafe-argument and async-return findings without blanket rule disables.
- [ ] Preserve existing agreed tests. Review any newly required failure scenarios as separate test work before implementation; do not change tests already under implementation without explicit user direction.
- [ ] Verify the existing suites and full lint diagnostics for the touched paths in the isolated adoption candidate.

Does not authorize implementation by an agent or new test edits now. Coordinate with section 3 for structured-output error metadata.

## 3. Validate model HTTP results and narrow structured-output error metadata

Project: `personal-assistant-project`. Priority: P1. Deferred until after the user installs v1.0.0. Issue creation and implementation owner: user.

### Problem

`Response.json()` produces unchecked values in `src/ollama.ts:71` and `scripts/demo-ollama-http.ts:14–17`; a declared result type is not runtime validation. `scripts/demo-structured-output.ts:31–33` reads unsafe callback error fields and interpolates them. The lint run reports five unsafe assignments, three unsafe member accesses and three unsafe arguments across these paths and section 2's error logger.

### Later work to consider

- [ ] User defines and implements the remote JSON validation/narrowing boundary before accessing expected fields.
- [ ] Preserve the existing model-call behavior while deliberately handling malformed/unavailable responses.
- [ ] Narrow structured-output exceptions and other `unknown` errors before accessing optional metadata; intentionally render absent values and coercions.
- [ ] Decide whether an empty `OLLAMA_BASE_URL` should retain its current fallback behavior before resolving the nullable-string/default findings; do not blindly replace `||` with `??`.
- [ ] Resolve relevant unsafe/member/template/default diagnostics without assertions that merely claim unvalidated data is safe.
- [ ] Preserve existing agreed tests; capture new validation test requirements in separately reviewed work before implementation.

Coordinate catch ownership with section 2. This is guided application work, not automatic lint autofix.

## 4. Align source and ESM test conventions with the reviewed core policy

Project: `personal-assistant-project`. Priority: P2. Deferred until after the user installs v1.0.0. Issue creation and implementation owner: user. Suggested order: after sections 2 and 3 settle behavior.

### Problem

The run identifies 63 style findings, 35 import-order findings, 18 required-brace findings, unused/shadowed bindings, `Number.NaN` conventions, missing exported return annotations, interface aliases and one type-only import. Nine ESM test files contribute 45 diagnostics even under the relaxed test profile. This is adoption work, separate from package/configuration defects.

### Later work to consider

- [ ] Review these convention costs and any narrow exceptions before changing source or test text.
- [ ] Apply accepted source conventions without changing runtime behavior or broadly disabling rule families.
- [ ] Explicitly agree any test-formatting scope with the user; preserve agreed test cases, assertions and behavior. No test changes are authorized by this draft's label alone.
- [ ] Retain the standard JavaScript test profile and import checks; do not classify implementation scripts or all tooling as tests to suppress findings.
- [ ] Verify existing compiler/tests and the complete lint command. If fixing is chosen later, review diffs and repeat only as needed; no one-pass convergence promise is made.

Record deliberate semantic/coercion choices separately from mechanical formatting.

## 5. Record compiler and tooling choices after installation

Project: `personal-assistant-project`. Priority: P2. Deferred until after the user installs v1.0.0. Issue creation and implementation owner: user. Consumer remediation is not a prerequisite for v1 publication or installation.

### Problem

The isolated package runs with TypeScript 7.0.2. Its public-declaration defect belongs to the lint package's release work; the unresolved consumer violations belong to later user-led work. The existing compiler lacks the policy's indexed-access setting and excludes `knip.ts`.

### Later work to consider

- [ ] After installing v1.0.0, capture the installed package version and current consumer snapshot as the baseline for user-created follow-up issues.
- [ ] Keep the highest stable compiler supported by the reassessed complete stack; do not downgrade solely because the lint repository retains development-only typescript-eslint.
- [ ] User enables `noUncheckedIndexedAccess` and decides whether `knip.ts` joins compiler coverage; preserve other justified compiler settings. The assessed snapshot passes both checks.
- [ ] Review the installed package's exact Oxlint peer, root-aligned configuration, lint command and exit handling.
- [ ] Resolve or explicitly document policy findings and narrow exceptions; retain typed rules and standard ESM test settings.
- [ ] Record fresh full compiler/test/lint results and distinguish native inferred coverage from explicit syntax-only exceptions. Do not introduce a custom typed-program preflight.
- [ ] Assess the existing Node 26 type declarations against the chosen application runtime if adopting newer APIs; the current passing tests do not certify every declared API.

Publication, v1 policy freeze and publisher account setup remain the lint project's separate release work. The user owns permanent installation and subsequent consumer issue creation and remediation.
