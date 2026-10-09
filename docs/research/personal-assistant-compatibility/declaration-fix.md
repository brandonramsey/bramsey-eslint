# Public declaration fix verification

Verified October 9, 2026, America/Chicago. **The public declaration defect from the initial assessment is resolved.** The consumer's policy violations remain deferred user-led work after installing v1.0.0; no consumer issues were created.

`ResolverOptions` now derives from the already-bundled `unrs-resolver` native options, omitting package-controlled `tsconfig`, and adds the same four fields as the installed provider interface: `project`, `alwaysTryTypes`, `bun` and `noWarnOnMultipleProjects`. Public declarations no longer reach the provider's private `eslint-import-context` declarations. Runtime resolver imports, options and behavior remain unchanged.

The existing packed-package test now lists the compiler's public declaration inputs and rejects private context/utils dependencies. It failed against the old declarations and passed after the change. This regression check covers the agreed public declaration surface; no consumer-installation or lint-engine harness was added to permanent tests.

A fresh isolated copy of the original consumer snapshot received the actual corrected `@brandonramsey/lint@0.2.0` tarball and exact Oxlint peer, with independent dependencies from cached public registry artifacts. Strict full-library compilation of the existing public fixture, covering the root and both plugin exports, passes under **TypeScript 5.9.3, 6.0.3 and 7.0.2**. The consumer still has no `@typescript-eslint/utils` package and retains hoisted `type-fest@0.21.3` plus the candidate's nested 5.10.0. Neither private dependency appears in the public compiler inputs, so the previous three errors are resolved without a compiler downgrade or skipped library checks.

All nine emitted JavaScript modules are byte-identical to the original candidate. Application TypeScript 7 checking with `noUncheckedIndexedAccess` passes. The full root lint command selects the same 21 consumer files and produces the same 174 normalized diagnostics; these consumer findings remain separate from the resolved package defect. Existing consumer tests were not repeated in this declaration-only follow-up; the original 20-test baseline remains historical evidence. The original consumer's HEAD, branch, index, Git status and all 39 non-ignored file hashes/modes still match the initial snapshot.

[Verification evidence](evidence/declaration-fix.json) records the exact archive SHA-256/integrity, source hash, commands, public compiler input lists, unchanged runtime modules and consumer preservation checks. The assessed tarball was packed after the code fix and before writing this follow-up documentation; its version remains 0.2.0. This is local candidate evidence, not a v1 publication or a hosted release-matrix result.

To repeat the public check in an isolated consumer, save the [fixture](evidence/declaration-fix-fixture.mts.txt) as `.public-api.mts` and the [config](evidence/declaration-fix-tsconfig.json) as `.public-config.json`, then run:

```fish
node node_modules/typescript/bin/tsc --project .public-config.json --noEmit --listFiles
```

The final repository `npm run check` passes strict typechecking, self-lint, all 21 public contract tests and reference drift checking. [Check output](evidence/declaration-fix-repository-check.txt) records the result.
