# Compatibility follow-up ticket drafts

Prepared from [issue #6's assessment](README.md). **Drafts only: no GitHub submission or consumer implementation is authorized by this document.** Review titles, scope and ownership with the user, check existing issues for duplicates, then publish accepted drafts in dependency order with canonical triage labels. Use native blockers where available; retain explicit cross-repository links otherwise.

## 1. Make packed public declarations independent of undeclared provider types

Repository: `brandonramsey/lint`. Priority: P1. Proposed triage: `ready-for-agent`. Origin: #6. If accepted, block permanent consumer adoption and the #7 v1 decision on this issue.

### Problem

An independent installation of `@brandonramsey/lint@0.2.0` exposes a resolver declaration graph that reaches `eslint-import-context@0.1.9`. Its undeclared utils import fails; its type-fest import resolves the consumer's hoisted 0.21.3, while the candidate's declared 5.10.0 is nested elsewhere. The same three errors occur with strict TypeScript 7.0.2 and 6.0.3. Repository provider availability masks this consumer integration failure.

### Acceptance criteria

- [ ] Resolve the public declaration dependency boundary without depending on consumer hoisting, optional undeclared types or `skipLibCheck`.
- [ ] Preserve the public factory/options contract. Prefer keeping private provider types behind the package boundary; if adding a compiler-dependent family, explicitly reassess its TypeScript ceiling before choosing it.
- [ ] Repack and repeat the isolated strict declaration assessment against the consumer's existing Jest dependency graph, with all required dependencies supplied by the package's public metadata.
- [ ] Retest the intended compiler support boundaries, including the consumer's TypeScript 7.0.2, and revise support claims according to evidence.
- [ ] Keep permanent regression coverage within ADR 0017's public declarations/metadata surface; this draft does not request a permanent consumer-execution harness.

Evidence: [TS7 errors](evidence/compiler-public-ts7.stdout), [TS6 errors](evidence/compiler-public-ts6.stdout), [fixture/config](README.md#reproduction-and-next-work), [dependency graph](toolchain.md#actual-public-declaration-blocker).

## 2. Handle CLI promise failures through explicit unknown error boundaries

Repository: `brandonramsey/personal-assistant-project`. Priority: P1. Proposed triage: `ready-for-human`. Implementation owner: user; assistant provides guidance/review/debugging.

### Problem

`scripts/demo-tool-requests.ts:11` leaves a `Promise<void>` unhandled. Three demo catch callbacks infer unsafe error types; `scripts/demo-tool-exchange.ts:28` passes the error directly to a string logger. The current 20 tests pass but do not establish all rejected-promise paths.

### Acceptance criteria

- [ ] User implements awaited/handled completion for the tool-request entrypoint with deliberate nonzero failure status.
- [ ] Narrow catch callback values from `unknown`, producing intentional string diagnostics and retaining useful error context.
- [ ] Resolve the applicable floating-promise, catch-variable, unsafe-argument and async-return findings without blanket rule disables.
- [ ] Preserve existing agreed tests. Review any newly required failure scenarios as separate test work before implementation; do not change tests already under implementation without explicit user direction.
- [ ] Verify the existing suites and full lint diagnostics for the touched paths in the isolated adoption candidate.

Does not authorize implementation by an agent or new test edits now. Coordinate with draft 3 for structured-output error metadata.

## 3. Validate model HTTP results and narrow structured-output error metadata

Repository: `brandonramsey/personal-assistant-project`. Priority: P1. Proposed triage: `ready-for-human`. Implementation owner: user.

### Problem

`Response.json()` produces unchecked values in `src/ollama.ts:71` and `scripts/demo-ollama-http.ts:14–17`; a declared result type is not runtime validation. `scripts/demo-structured-output.ts:31–33` reads unsafe callback error fields and interpolates them. The lint run reports five unsafe assignments, three unsafe member accesses and three unsafe arguments across these paths and draft 2's error logger.

### Acceptance criteria

- [ ] User defines and implements the remote JSON validation/narrowing boundary before accessing expected fields.
- [ ] Preserve the existing model-call behavior while deliberately handling malformed/unavailable responses.
- [ ] Narrow structured-output exceptions and other `unknown` errors before accessing optional metadata; intentionally render absent values and coercions.
- [ ] Decide whether an empty `OLLAMA_BASE_URL` should retain its current fallback behavior before resolving the nullable-string/default findings; do not blindly replace `||` with `??`.
- [ ] Resolve relevant unsafe/member/template/default diagnostics without assertions that merely claim unvalidated data is safe.
- [ ] Preserve existing agreed tests; capture new validation test requirements in separately reviewed work before implementation.

Coordinate catch ownership with draft 2. This is guided application work, not automatic lint autofix.

## 4. Align source and ESM test conventions with the reviewed core policy

Repository: `brandonramsey/personal-assistant-project`. Priority: P2. Proposed triage: `ready-for-human`. Implementation owner: user. Suggested order: after drafts 2 and 3 settle behavior.

### Problem

The run identifies 63 style findings, 35 import-order findings, 18 required-brace findings, unused/shadowed bindings, `Number.NaN` conventions, missing exported return annotations, interface aliases and one type-only import. Nine ESM test files contribute 45 diagnostics even under the relaxed test profile. This is adoption work, separate from package/configuration defects.

### Acceptance criteria

- [ ] Review these convention costs and any narrow exceptions before changing source or test text.
- [ ] Apply accepted source conventions without changing runtime behavior or broadly disabling rule families.
- [ ] Explicitly agree any test-formatting scope with the user; preserve agreed test cases, assertions and behavior. No test changes are authorized by this draft's label alone.
- [ ] Retain the standard JavaScript test profile and import checks; do not classify implementation scripts or all tooling as tests to suppress findings.
- [ ] Verify existing compiler/tests and the complete lint command. If fixing is chosen later, review diffs and repeat only as needed; no one-pass convergence promise is made.

Record deliberate semantic/coercion choices separately from mechanical formatting.

## 5. Adopt the corrected packed policy with consumer-owned execution

Repository: `brandonramsey/personal-assistant-project`. Priority: P2. Proposed triage: `ready-for-human`. Implementation owner: user. Blocked by: accepted draft 1 and agreed resolutions or explicit deferrals of drafts 2–4.

### Problem

The isolated package runs with TypeScript 7.0.2, but permanent adoption currently has both a public-declaration blocker and unresolved consumer violations. The existing compiler lacks the policy's indexed-access setting and excludes `knip.ts`.

### Acceptance criteria

- [ ] Review a freshly packed corrected candidate and repeat the isolated assessment at the current consumer snapshot before permanent installation.
- [ ] Keep the highest stable compiler supported by the reassessed complete stack; do not downgrade solely because the lint repository retains development-only typescript-eslint.
- [ ] User enables `noUncheckedIndexedAccess` and decides whether `knip.ts` joins compiler coverage; preserve other justified compiler settings. The assessed snapshot passes both checks.
- [ ] User installs the actual package and exact Oxlint peer, saves a root-aligned configuration, and owns the lint command and exit handling.
- [ ] Resolve or explicitly document policy findings and narrow exceptions; retain typed rules and standard ESM test settings.
- [ ] Record fresh full compiler/test/lint results and distinguish native inferred coverage from explicit syntax-only exceptions. Do not introduce a custom typed-program preflight.
- [ ] Assess the existing Node 26 type declarations against the chosen application runtime if adopting newer APIs; the current passing tests do not certify every declared API.

Publication, v1 policy freeze and publisher account setup remain the lint project's separate release work. Permanent installation and remediation require subsequent user-led work.
