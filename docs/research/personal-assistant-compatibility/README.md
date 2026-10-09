# Personal assistant compatibility assessment

Issue [#6](https://github.com/brandonramsey/lint/issues/6), assessed October 8–9, 2026, America/Chicago. **Initial result: defer permanent adoption.** The packed candidate runs successfully with the consumer's existing TypeScript 7.0.2, but its strict public declarations fail in this independently installed consumer. The complete lint run also identifies 174 consumer policy violations. Neither source remediation nor permanent lint installation was performed.

Follow-up, October 9: the [public declaration fix](declaration-fix.md) resolves the package defect and verifies the corrected candidate under TypeScript 5.9.3, 6.0.3 and 7.0.2. Results below describe the original artifact and remain historical evidence. Consumer issues stay deferred to the user after installing v1.0.0.

## Snapshot and artifact

| Item | Assessed value |
| --- | --- |
| Consumer | `personal-assistant-project`, active branch `codex/oxlint-rules` |
| Consumer HEAD | `92976709455f3d5888e474236ddeedbd4b0de616` |
| Current work | All 39 tracked/non-ignored files copied, including the committed model demos, measurement implementation and nine ESM test suites; no staged, unstaged or non-ignored untracked work existed |
| Candidate | Actual packed `@brandonramsey/lint@0.2.0`, 88 files, 327,338 bytes |
| Candidate source | `a711868c1de6685aa2529bcf6b6952e8397734a3`; built and packed from a separate `git archive` of that commit, excluding this assessment's changes |
| Archive SHA-256 | `e099aaf380b4f1dc007553cb09f27558aa164a13a6d9960b0e118f5a171f76de` |
| Runtime | Node 24.21.0, npm 11.19.0, macOS arm64 |
| Lint stack | Oxlint 1.87.0, bundled tsgolint 7.0.2003, Stylistic 5.10.0, ESLint provider 10.12.0 |
| Compilers | Consumer TypeScript 7.0.2; package build and additional declaration probe TypeScript 6.0.3 |
| Application dependencies | Jest / `@jest/globals` 30.5.2, `@types/node` 26.6.4, LangChain core 1.2.17 / Ollama 1.3.0, Zod 4.6.5 |

The lab was `/private/tmp/lint-issue6-bto2_mwq`, with separate `baseline`, `candidate` and `package-source` directories. The package-source build alone used the lint repository's installed build tools; **consumer dependencies were installed independently**, without linking the lint repository's providers into either consumer copy. Baselines used the consumer lockfile. Candidate installation fetched public registry dependencies with the actual tarball and exact Oxlint peer; 116 packages were added, and `npm ls --all --json` exited 0. Dependency lifecycle scripts were disabled; the shipped native binaries ran successfully.

The original checkout's HEAD, branch, index hash, Git status, complete non-ignored file inventory, file hashes and modes matched before and after the experiments. Ignored credentials and personal configuration were neither copied nor inspected. The original package/lockfile, configuration, implementation and agreed tests remain unchanged. [Snapshot, artifact and command evidence](evidence/assessment.json) records these comparisons; [resolved dependency versions and integrity](evidence/installed-packages.json) make the assessed lockfile resolution explicit, including optional platform packages that may not be installed on this host.

## Compiler support and required baseline

Keep **TypeScript 7.0.2** for this consumer assessment. It is the highest stable registry version observed during research and the stated target of tsgolint 7.0.2003. Native lint execution and application compilation demonstrate compatibility on these files. The lint repository's retained development-only `typescript-eslint@8.71.1` ceiling (`<6.1.0`) does not require downgrading this application's compiler. See the primary sources and qualified support conclusion in [toolchain.md](toolchain.md).

**Initial full strict public-type compatibility was blocked.** The exported resolver types reached `eslint-import-context@0.1.9`, whose declarations imported undeclared `@typescript-eslint/utils` and `type-fest`. The independently installed consumer had no utils package; the hoisted context resolved Jest's older `type-fest@0.21.3`, instead of the candidate's nested 5.10.0. Both TypeScript 7.0.2 and 6.0.3 reported the same three errors. Adding the compiler-dependent utils family as a workaround would introduce its `<6.1.0` peer ceiling: this is the single family that would block TypeScript 7 under that remedy. A downgrade alone could not supply the missing types. The [selected fix](declaration-fix.md) removes this private declaration path and passes the fresh packed assessment under 5.9.3, 6.0.3 and 7.0.2.

The existing consumer config already enables `strict`, NodeNext modules, `noEmit`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions` and `verbatimModuleSyntax`. It includes the ten `src`/`scripts` TypeScript files. The policy additionally expects `noUncheckedIndexedAccess: true`; this property was enabled **only in the isolated candidate's config**. Compilation passes with that addition, all tests still pass, and the normalized lint diagnostics are identical before and after it. There are no new indexed-access compiler failures to remediate at this snapshot.

`knip.ts` is outside the original compiler include. A separate strict TypeScript 7 command checked all eleven TypeScript files, including it, with the same options and indexed-access checking; it passes. Extending permanent compiler coverage is a follow-up decision. ESM tests and `jest.config.mjs` execute as JavaScript; no `checkJs` baseline was introduced. TypeScript 7's explicit-file probes required `--ignoreConfig`, and the public fixture required the consumer's `types: ["node"]`; initial command setup errors were corrected before classifying package findings. The final declaration probes use an isolated config extending the consumer's actual config.

## Coverage and effective reference profiles

The complete root lint command selected **21 of 21 original JavaScript/TypeScript files**, verified with Oxlint's `--debug files` output. No consumer source, test or tooling configuration was omitted. The package's generated/dependency exclusions remained in force. Only the two assessment-created code files—the lint configuration and public declaration fixture—were additionally ignored.

| Files | Count | Effective reference profile | Enabled rules |
| --- | ---: | --- | ---: |
| `src/*.ts`, `scripts/*.ts`, `knip.ts` | 11 | `typescript-esm`, with typed rules enabled | 265 |
| `tests/*.test.mjs` | 9 | `javascript-test-esm`, standard relaxed test profile | 199 |
| `jest.config.mjs` | 1 | `javascript-esm` | 203 |

Resolved configured rule settings and globals for representatives of all three groups match the packed reference profiles. [Effective profile evidence](evidence/effective-profiles.json) includes every group's file list, exact rule settings, globals, plugin specifiers, typed/unused-directive options and import-resolver project. No consumer rule overrides, extra test patterns or syntax-only exceptions were used. The engine reports 284 rules for the run; that run-level number is distinct from each resolved profile's enabled-rule count.

The import resolver selects the isolated root `tsconfig.json`. Native tsgolint owns typed-program discovery under [ADR 0018](../../adr/0018-use-native-typed-project-coverage.md); resolver selection does not prove typed-program membership. `knip.ts` is outside the configured compiler include and has typed rules configured; native inferred coverage is possible. The run did not expose per-file program provenance, so no stronger membership claim is made. No custom coverage warning is expected. CommonJS, declarations, JSX/TSX, monorepos and explicit syntax-only profiles have no files in this consumer and were not exercised here.

## Results

| Check | Original baseline | Candidate installed | Indexed-access adjustment |
| --- | --- | --- | --- |
| Application `tsc --noEmit`, TypeScript 7.0.2 | Exit 0 | Exit 0 | Exit 0 |
| Existing Jest suite, `npm test -- --runInBand` | 9 suites / 20 tests pass | 9 suites / 20 tests pass | 9 suites / 20 tests pass |
| Complete lint, no autofix | No existing lint command | Exit 1: 174 errors, 0 warnings | Exit 1: same 174 errors, identical normalized diagnostics |
| Strict public config declarations | Not applicable | 3 errors under TypeScript 7.0.2 | Same 3 errors under TypeScript 6.0.3 control |

The first sandboxed Jest run failed all tests because binding `127.0.0.1` was prohibited. Re-running the unchanged suites with loopback access established the passing baselines above; those permission errors are **environment failures, not pre-existing application failures**. No unrelated compiler/test failure was observed. Logs are retained for the [restricted attempt](evidence/tests-baseline.txt), [original executable baseline](evidence/tests-baseline-unrestricted.txt), [candidate](evidence/tests-candidate.txt) and [adjusted config](evidence/tests-adjusted.txt).

All lint diagnostics are errors: **63 style, 35 import-order policy, 23 core, 3 Unicorn and 50 TypeScript**. The TypeScript total includes 14 syntax/interface-policy findings and 36 typed findings. Nineteen files have diagnostics; `src/types.ts` and `jest.config.mjs` are clean. [Original diagnostics](evidence/lint-original.json) and [adjusted diagnostics](evidence/lint-adjusted.json) preserve every message and location; the assessment JSON aggregates by rule and file.

## Prioritized findings

| Priority / owner | Finding | Evidence and implication |
| --- | --- | --- |
| P1 / lint package | Public declaration dependency leak | `eslint-import-context/lib/types.d.ts:1` cannot resolve utils; `type-fest/ts41/get.d.ts:93–94` fails its generic constraint. Both [TS7](evidence/compiler-public-ts7.stdout) and [TS6](evidence/compiler-public-ts6.stdout) fail. This is a package integration defect and blocks claiming strict public-type adoption. Runtime configuration loading still succeeds. |
| P1 / consumer, user-led | Floating promise and unsafe error callbacks | `scripts/demo-tool-requests.ts:11` has the sole `no-floating-promises` diagnostic. Three `.catch` callback parameters remain unsafe; `demo-tool-exchange.ts:28` passes one to a string logger. Passing happy-path tests do not prove failure handling. |
| P1 / consumer, user-led | JSON/error boundaries lack narrowing | Five unsafe assignments, three unsafe member accesses and three unsafe arguments concern model HTTP JSON and error metadata. Examples: `src/ollama.ts:71`, `scripts/demo-ollama-http.ts:14–17`, `scripts/demo-structured-output.ts:31–33`. Type annotations alone do not validate remote JSON. |
| P2 / consumer, user-led | Explicit coercion, environment defaults and async return conventions | Three nullable-string conditions / nullish-default findings, seven template-coercion findings, three `return-await` findings and three confusing-void returns. Replacing `||` with `??` changes empty-string behavior, so defaults need an intentional decision rather than an automatic edit. |
| P2 / consumer, user-led | Style, import and interface conventions | 63 Stylistic findings, 35 import-order findings, 18 core brace findings, four unused bindings, one shadowed binding, three `Number.NaN` findings, nine exported-return annotations, four interface-to-type findings and one type-only import. Existing ESM tests contribute 45 diagnostics; their relaxed profile still retains formatting/import rules. |
| P2 / consumer adoption | Compiler/tooling configuration | Enable indexed-access checking; decide whether to include `knip.ts`; keep TypeScript 7; review the consumer-owned lint command after installing v1.0.0. `@types/node` 26 exceeds the Node 24 runtime's API generation; no observed failure establishes a need to change it in this assessment. |

There was no observed engine crash, missing runtime plugin, unresolved consumer import, config-load failure or ignored consumer code file. That bounded result does not establish universal bridge correctness or v1 readiness. The public declaration defect is separate from the 174 consumer policy violations and from accepted limitations in [ADR 0017](../../adr/0017-publish-configuration-and-plugins-without-a-runner.md).

## Reproduction and next work

Copy the consumer's tracked/non-ignored working files to a fresh lab, including active changes when present, and capture its status and hashes. Build/package the pinned candidate separately. Run `npm ci` against the original consumer lockfile for the baseline, then install the tarball and exact Oxlint peer only in the candidate copy. The recorded dependency resolution is dated evidence; a fresh resolution can differ.

From the isolated candidate root, the assessed commands were:

```fish
npm install --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org --save-dev ../brandonramsey-lint-0.2.0.tgz oxlint@1.87.0 typescript@7.0.2
node node_modules/typescript/bin/tsc --noEmit
npm test -- --runInBand
node_modules/.bin/oxlint --config .oxlint-compat.config.mjs --format json .
node_modules/.bin/oxlint --config .oxlint-compat.config.mjs --debug files .
```

Use the saved [lab config](evidence/lab-config.mjs.txt); add `noUncheckedIndexedAccess` in the isolated config and repeat compiler, tests and lint. For the declaration defect, save the [fixture](evidence/public-config-fixture.mts.txt) as `.compat-configuration.mts` and the [extending config](evidence/public-config-tsconfig.json) as `.compat-public.json`, then run `node node_modules/typescript/bin/tsc --project .compat-public.json --noEmit`. Full library checking is retained. No command used autofix.

The [lint package ticket draft and deferred consumer notes](follow-up-ticket-drafts.md) separate release work from later application work. On October 9, 2026, the user deferred personal-assistant-project issues until after installing `@brandonramsey/lint@1.0.0` and retained responsibility for creating them. Consumer policy violations and issue creation are not prerequisites for v1 publication. The package declaration defect is now resolved and the corrected artifact has been reassessed in the [follow-up verification](declaration-fix.md). Consumer implementation stays user-led under its README, AGENTS.md and ADR 0001; existing agreed tests were not changed. No tickets were submitted.

The lint repository's full `npm run check` also passes: strict typecheck, self-lint, all 21 public contract tests and reference drift checking. [Check output](evidence/repository-check.txt) records that result. Passing repository-only declarations does not override the independent consumer declaration failure above.
