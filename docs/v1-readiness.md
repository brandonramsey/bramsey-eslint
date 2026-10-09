# V1 readiness review

Prepared October 9, 2026, America/Chicago, for [issue #7](https://github.com/brandonramsey/lint/issues/7). **Maintainer decision: go. The stable core policy boundary below is approved and frozen for v1 release preparation.** The assessed package remains `@brandonramsey/lint@0.2.0`; this review neither changes its version nor authorizes publication.

## Review scope and prerequisites

The reviewed source is `27a7dd5bfd59c143f530714809d20f773375c20c`, the merged [#5 completion audit, PR #28](https://github.com/brandonramsey/lint/pull/28). GitHub confirms issues #1–#6 and #8–#14 are closed. Issue #11 was withdrawn by [ADR 0018](adr/0018-use-native-typed-project-coverage.md), rather than implemented. The maintainer's explicit go decision for #7 is recorded below.

`gh stack sync` brought `main` to that merged commit. Because the previous stack was fully merged, `gh stack trunk` followed by `gh stack init --base main feat/7-v1-readiness` started the next stack after #5. The review adds documentation and evidence; package sources, dependencies, rule settings, generated examples and workflows are unchanged.

| Issue #7 requirement | Evidence and remaining action |
| --- | --- |
| Repeat isolated validation for a changed candidate | A newly packed artifact was installed into a fresh copy of the unchanged consumer snapshot. Compiler, tests, public declarations and full lint were repeated; results below match #6. Repeat against the final versioned candidate if its contents differ. |
| Complete migration, inspect the package and validate same-tag workflows | Migration prerequisites are closed. Runtime/declaration files and generated examples match both #6's corrected artifact and the public `0.2.0` artifact. The published tag's four-job matrix and three non-publishing gate rehearsals were re-read through GitHub. A future v1 tag must pass its own matrix. |
| Resolve or defer findings and document limitations | The findings ledger below distinguishes the resolved package defect, deferred consumer work and approved limitations. No new package release-blocking defect was observed. |
| Reconcile release history, identities, links and publisher setup | Current registry metadata and provenance identify `brandonramsey/lint` and `@brandonramsey/lint@0.2.0`; historical `@brandonramsey/eslint@0.1.0` remains available. Publisher evidence and its verification boundary are below. |
| Record compiler baseline, exceptions, profiles and coverage limits | The support boundary below retains repository TypeScript 6.0.3, documents the typescript-eslint ceiling and independently checked public declarations at 5.9.3/6.0.3/7.0.2. All 14 reference profiles remain unchanged. |
| Maintainer go/no-go decision and stable policy boundary | The maintainer approved the boundary below on October 9, 2026. The explicit decision is recorded below; publication is a separate authorized action. |

## Fresh artifact and isolated consumer results

[Assessment evidence](research/v1-readiness/assessment.json) records the manifest, packed inventory, commands and exit codes, source/file hashes, registry responses, workflow outcomes and provenance statement. The actual tarball was packed from the clean reviewed source before adding this review's documentation:

- Package: `@brandonramsey/lint@0.2.0`; archive size: 420,499 bytes.
- Archive SHA-256: `53830f02dc2961fa6de282b31345b7c55c1068194c751f01e66672b3a792b8df`.
- Runtime: Node 24.21.0, npm 11.19.0, macOS arm64.
- Consumer: `personal-assistant-project`, branch `codex/oxlint-rules`, HEAD `92976709455f3d5888e474236ddeedbd4b0de616`; all 39 tracked/non-ignored files included, with no active uncommitted work at this snapshot.
- Lab: `/private/tmp/lint-issue7-jmglz9pq`, independent baseline and candidate installations from public registry dependencies; lifecycle scripts disabled.

All nine runtime modules, nine declaration files and 17 generated/example files are byte-identical to #6's corrected candidate and the public `0.2.0` package. The compared public manifest fields are also unchanged from #6. Documentation changes account for the different archive identity. The published tarball's SHA-512 integrity was independently checked against registry metadata.

| Check | Original baseline | Candidate installed | Candidate with indexed-access checking |
| --- | --- | --- | --- |
| Application TypeScript 7.0.2, `tsc --noEmit` | Pass | Pass | Pass |
| Existing Jest tests | 9 suites / 20 tests pass | 9 suites / 20 tests pass | 9 suites / 20 tests pass |
| Full lint, no autofix | No existing lint command | 174 errors | Same 174 errors |
| Strict public declarations | Not applicable | All three exports pass with TypeScript 5.9.3, 6.0.3 and 7.0.2 | Public probes use indexed-access checking and full library checking |

The [baseline](research/v1-readiness/tests-baseline.txt), [installed candidate](research/v1-readiness/tests-candidate.txt) and [adjusted candidate](research/v1-readiness/tests-adjusted.txt) logs retain the existing test outcomes. The [lab configuration](research/v1-readiness/consumer-config.mjs.txt) adds no consumer rule overrides or syntax-only exceptions. The complete lint command selects all 21 original code files: 11 TypeScript implementation/tooling files, nine ESM test files and `jest.config.mjs`. Their effective reference profiles remain `typescript-esm`, `javascript-test-esm` and `javascript-esm`, as recorded in [#6's profile evidence](research/personal-assistant-compatibility/evidence/effective-profiles.json).

Diagnostics match #6 and match before/after `noUncheckedIndexedAccess` when complete diagnostic objects are sorted; parallel engine output order differs. They remain 63 style, 35 import-order, 23 core, three Unicorn and 50 TypeScript findings. The original consumer's HEAD, branch, index hash, status and all 39 file hashes/modes match before and after. Ignored credentials/configuration were neither inspected nor copied. Permanent adoption and consumer source/test changes remain user-led.

The new checks are one-off release evidence. Permanent tests retain [ADR 0017's public package scope](adr/0017-publish-configuration-and-plugins-without-a-runner.md); this review adds no consumer execution harness or upstream behavior suite. The tarball above does not contain this subsequently written review or a `1.0.0` version change. Final release preparation must record the final artifact and repeat isolated validation when it differs; these results are not a v1 publication or v1 tag-matrix result.

## Findings ledger

| Finding | Disposition and owner |
| --- | --- |
| Public resolver declarations leaked private provider dependencies | **Resolved in the package**, commit `9c044f6`; the fresh independent installation passes strict compilation of all public exports under all three assessed compilers. See the [fix verification](research/personal-assistant-compatibility/declaration-fix.md). |
| Floating promise, unsafe error callbacks and unchecked JSON/error metadata | **Deferred consumer work, user-owned**, after v1 installation. Existing passing tests do not prove every rejected-promise or malformed-response path. See [follow-up notes 2–3](research/personal-assistant-compatibility/follow-up-ticket-drafts.md). |
| Coercion, empty-string defaults, async returns, style, imports and interface conventions | **Deferred consumer work, user-owned**. Deliberate semantic choices precede mechanical changes; existing test cases remain unchanged. No blanket policy exceptions were added. See [notes 2–4](research/personal-assistant-compatibility/follow-up-ticket-drafts.md). |
| Missing `noUncheckedIndexedAccess`; `knip.ts` outside the consumer compiler include | **Deferred consumer configuration work**. Indexed-access checking passes in the isolated copy; #6's explicit-file probe checked `knip.ts`, and fresh lint includes it. Native typed-program membership is not independently certified. See [note 5](research/personal-assistant-compatibility/follow-up-ticket-drafts.md). |
| Consumer Node 26 declarations with Node 24 runtime | **Deferred consumer compatibility review** if newer APIs are adopted. No observed failure requires a downgrade; passing these files does not certify every declared API. |
| Disable-comment explanations cannot be enforced reliably through the selected bridge | **Accepted in ADR 0017**. Descriptions remain recommended; unused-directive errors and blanket-disable rejection remain configured. No runner/preflight is promised. |
| Overlapping style/import fixes can require repeated invocations | **Accepted in ADR 0017**, consumer-owned fixing. Research observed multiple modifying passes; no one-pass or universal convergence bound is promised. |
| Native parsing differs from forced ESLint source/scope modes | **Accepted in ADR 0016**. Package/extension/pattern policy remains; patterns do not force native parser mode. |
| Native inferred typed coverage and separate import-resolver discovery | **Accepted in ADR 0018**. No custom coverage warning, independent compiler inspection or configured-program membership guarantee. Explicit syntax-only and declaration exemptions remain. |
| Simplified native naming scope | **Accepted migration convention reduction**, recorded in [the candidate naming assessment](research/oxlint-candidate/README.md#simplified-naming-scope) under ADR 0014. Shared casing replaces role-specific/I-prefix restrictions; type aliases, members and renamed destructured aliases have the recorded native scope limitations. |
| Three ESLint core providers use `eslint/use-at-your-own-risk`; bridge remains an upstream integration risk | **Pinned and documented package limitation**, not a new defect. Public packed-plugin checks verify availability of the exact providers, not future API stability or universal AST parity. Reassess provider/dependency upgrades. See [support](support.md#dependency-and-provider-boundary). |
| Nursery diagnostics and dangerous fixes | **Explicit curated policy**, documented in [the option review](research/oxlint-candidate/README.md#rule-mapping-and-option-decisions). Consumer execution owns fix flags; ordinary fixing does not imply enabling dangerous fixes. |

No consumer remediation or consumer issue publication is required for the lint package's v1 decision. The October 9 maintainer deferral in the [follow-up notes](research/personal-assistant-compatibility/follow-up-ticket-drafts.md) remains authoritative. Any newly accepted release-blocking package defect must become an explicit dependency of #7 before proceeding.

## Approved stable core policy boundary

The maintainer approved freezing the explicitly curated policy and public factory/configuration/plugin contract in the reviewed source, with the accepted limitations above:

1. Framework-neutral Node TypeScript and JavaScript policy, including JSX/TSX, ESM/CommonJS, handwritten declarations, tests and intentional syntax-only exceptions. The [reference index](../examples/README.md) records all 14 profiles and 982 available rules per profile, including disabled rules; profile enabled counts differ.
2. Native Oxlint plus bundled tsgolint, all 66 configured Stylistic settings and selected policy-plugin import/runtime/export checks. Retain the 48 configured typed checks, including promise and unsafe-value safety. Keep explicit rule/options curation, generated references and final consumer override precedence; do not adopt moving upstream presets wholesale.
3. Compiled ESM default configuration, `createConfig`, public option/configuration types and `plugins/style` / `plugins/policy`. Consumers own commands, selection, fixing and exit handling. The package supplies required providers and typed engine, with Oxlint as its exact peer and no executable.
4. Keep the [support contracts](support.md): lint runtime Node `^22.13.0 || >=24.0.0`; default application API target Node `>=24.0.0`; Oxlint 1.87.0 and tsgolint 7.0.2003; public declaration baseline TypeScript `>=5.9`. Use explicit `.mjs` configuration on supported Node 22 before 22.18; native TypeScript config execution requires the later Node boundary documented there.
5. Retain repository TypeScript 6.0.3. Fresh registry metadata reports stable 7.0.2; 6.0.3 is the highest stable version within retained `typescript-eslint@8.71.1`'s `>=4.8.4 <6.1.0` peer range. That development-only family is the single assessed repository upgrade blocker. It does not require a consumer compiler downgrade. tsgolint embeds its own compiler targeting 7.0.2; changing the consumer compiler does not replace it.
6. Under [ADR 0011](adr/0011-stabilize-the-policy-before-one-point-zero.md), newly enforced rules, stricter defaults and increased runtime requirements after v1 require a major release. Optional features can be minor releases and nonbreaking fixes patch releases. Review dependency changes for policy effects and preserve the documented boundary.

The support conclusions are bounded by the recorded contracts and exercised snapshots. CommonJS, declarations, JSX/TSX, monorepos and syntax-only profiles remain covered by the existing public contract/reference checks and historical migration research; this consumer contains no files exercising every profile. The fresh consumer assessment does not expand platform, grammar or application support guarantees.

## Workflow, identity and publisher evidence

The public registry still serves both [the new `0.2.0` package](https://registry.npmjs.org/@brandonramsey%2flint/0.2.0) and [historical `@brandonramsey/eslint@0.1.0`](https://registry.npmjs.org/@brandonramsey%2feslint/0.1.0). The current public GitHub repository is `brandonramsey/lint`, ID `1409414543`; use canonical links because the [identity audit](releasing.md#october-9-completion-audit) observed unreliable legacy issue redirects. Current design, interface and support docs correctly distinguish the two release identities. Historical proposals and ADR text remain dated evidence with supersession links.

The [published tag run](https://github.com/brandonramsey/lint/actions/runs/37959634490) still reports success at `36941f4cd6e71966786fd6ca608ef773a348e355`: version guard, all four Node 22.13.0/24 × TypeScript 5.9.3/6.0.3 jobs, release gate and publication. The [success](https://github.com/brandonramsey/lint/actions/runs/37884207483), [matrix-failure](https://github.com/brandonramsey/lint/actions/runs/37884209987) and [tag-mismatch](https://github.com/brandonramsey/lint/actions/runs/37884212640) rehearsals still report the expected gate outcomes at `965039d973ccf7dbed8814868c25fe4ce7655207`; all skipped publication and passed their result assertions. The workflow files and version guard have no changes since these runs.

The [registry provenance statement](https://registry.npmjs.org/-/npm/v1/attestations/@brandonramsey%2flint@0.2.0) names `brandonramsey/lint`, `.github/workflows/publish.yml`, `refs/tags/v0.2.0`, that published commit and the hosted run. Its subject digest matches the registry tarball. This review inspected the statement and digest; it did not independently reverify attestation signatures cryptographically.

GitHub's `npm` environment still exists. The current trusted-publisher binding was verified by the maintainer on October 9 in [#4's completion audit](releasing.md#october-9-completion-audit): repository `brandonramsey/lint`, file `publish.yml`, environment `npm`, permissions `createPackage` and `createStagedPackage`. This review rechecked environment existence and publication/provenance evidence; it did not perform a new npm account/2FA challenge or independently reread the account binding. Reconfirm the binding immediately before a separately authorized release, as required by [the release procedure](releasing.md#each-release).

Fresh local `npm run check` passed: clean build, strict types, combined repository lint, all 21 public contract tests and reference drift for 14 profiles with 982 rules each. [repository-check.txt](research/v1-readiness/repository-check.txt) records the output. Hosted runs above establish results only for their recorded SHAs. A future v1 release must validate its exact tagged commit through the complete matrix; neither this local check nor a prior branch/tag run substitutes for it.

## Maintainer decision record

- Decision: **go — stable core policy freeze approved**.
- Decision maker/date: **maintainer, October 9, 2026 (America/Chicago)**, by explicit response in the implementation chat: “Go — approve the policy freeze”.
- Approved scope: **the stable core policy boundary above**, including the documented engine limitations and deferred user-owned consumer work. This approval follows review of [PR #29](https://github.com/brandonramsey/lint/pull/29).
- Release authorization: **not granted by this review**.

The decision comes from the maintainer's explicit approval, rather than passing checks or the request to prepare this review. No additional policy exceptions or release-blocking package defects were introduced by that decision. This completes #7's readiness decision; versioned release preparation and publication remain separate work.

Next, prepare the separate `1.0.0` version/changelog candidate, record its exact packed artifact and repeat isolated validation if it differs, then request explicit release authorization. Only the authorized matching tag may initiate publication, and its own full matrix must pass.
