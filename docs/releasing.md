# Release setup

`@brandonramsey/lint@0.2.0` was published from GitHub `brandonramsey/lint` on October 9, 2026 with public access. This is a new npm identity, not a rename of a registry package. Version `0.2.0` continues the pre-v1 sequence and avoids reusing the existing historical `v0.1.0` Git tag. Keep historical `@brandonramsey/eslint` releases intact.

Publication requires the full compatibility matrix to pass for the exact tagged commit and a separate explicit release action. The [publish workflow](../.github/workflows/publish.yml) calls the [reusable validation workflow](../.github/workflows/ci.yml) from the same commit, with every checkout pinned to `github.sha`. Its `release-ready` job depends on both the version guard and the entire validation matrix; publication depends on that gate. A failed, cancelled or skipped prerequisite prevents publication. A successful unrelated branch run is never release evidence.

## Published 0.2.0 evidence

Verified on October 9, 2026:

- The [GitHub release](https://github.com/brandonramsey/lint/releases/tag/v0.2.0) identifies tag `v0.2.0` and commit `36941f4cd6e71966786fd6ca608ef773a348e355`.
- The [tag publication workflow](https://github.com/brandonramsey/lint/actions/runs/37959634490) reports that exact `headSha`. Its version guard, all four Node 22.13.0/24 and TypeScript 5.9.3/6.0.3 validation jobs, release-ready gate and public publication job passed.
- [Public registry metadata](https://registry.npmjs.org/@brandonramsey%2flint/0.2.0) reports version `0.2.0`, the same `gitHead`, the three promised export paths, exact Oxlint peer and bundled providers. The registry recorded publication at `2026-10-09T16:35:15.421Z`; the package's `latest` tag resolves to `0.2.0`.
- The [registry tarball](https://registry.npmjs.org/@brandonramsey/lint/-/lint-0.2.0.tgz) matches the registry's SHA-512 integrity. Direct archive inspection found all six public JavaScript/declaration export targets, compiled supporting modules, README/license/changelog/glossary, support/interface docs and editable/reference examples. It contains no root source, test or tooling directories and declares no executable. Historical research remains under `docs/research/`.
- The [registry provenance statement](https://registry.npmjs.org/-/npm/v1/attestations/@brandonramsey%2flint@0.2.0) names this repository, `.github/workflows/publish.yml`, tag `v0.2.0`, the same commit and workflow run. Its subject digest matches the downloaded tarball. This audit inspected the statement and digest; the [release record](https://github.com/brandonramsey/lint/releases/tag/v0.2.0) separately records npm signature/attestation verification and a fresh registry smoke check performed during release verification.

This establishes publication of `0.2.0`; bootstrap is complete. The one-time instructions below are retained as setup history, and future releases still require explicit authorization and verification of their own tag, matrix and publisher binding. The issue #12 audit installs no consumer and adds no lint-engine behavior tests.

## Release validation matrix

| Node runtime | Declaration/build TypeScript | Oxlint | Bundled typed engine |
| --- | --- | --- | --- |
| 22.13.0 | 5.9.3 and 6.0.3 | 1.87.0 | oxlint-tsgolint 7.0.2003 |
| 24 (latest patch) | 5.9.3 and 6.0.3 | 1.87.0 | oxlint-tsgolint 7.0.2003 |

These are four jobs. Each starts with `npm ci`, explicitly installs its selected TypeScript without changing the committed manifests/lockfile, reports installed versions and runs `npm run check`: clean builds, strict source/tooling/declaration checking, repository Oxlint/tsgolint/Stylistic self-lint, public configuration and packed-module/asset tests, and generated-reference drift checks. Packed tests inspect modules/declarations directly; they install no consumer and run no lint engine, following [ADR 0017](adr/0017-publish-configuration-and-plugins-without-a-runner.md). All matrix jobs finish even when one fails.

The Oxlint/tsgolint pair is fixed by the package contract; changing the `tsc` version does not change tsgolint's embedded compiler. TypeScript 6.0.3 is the highest mutually supported stable repository compiler in the October 8, 2026 assessment. Stable 7.0.2 remains blocked by the single **typescript-eslint** family (`>=4.8.4 <6.1.0`); report and reassess this ceiling when updating dependencies. [Support boundaries](support.md) separates published dependency contracts from demonstrated compatibility. The configured matrix alone does not prove a successful hosted run; retain the workflow URL and commit SHA as execution evidence.

## Non-publishing gate rehearsal

Run `publish.yml` through `workflow_dispatch` against the reviewed branch or commit, passing the candidate version tag as an input. This creates no Git tag. Dispatches always skip the `publish` job, its `npm` environment and its OIDC permission, even when every check passes. The normal tag-push path has no rehearsal override. GitHub requires the workflow file to exist on the default branch for [manual dispatch](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

```fish
gh workflow run publish.yml --ref main -f rehearsal=success -f tag=v0.2.0
gh workflow run publish.yml --ref main -f rehearsal=matrix-failure -f tag=v0.2.0
gh workflow run publish.yml --ref main -f rehearsal=tag-mismatch -f tag=v0.2.0
gh run list --workflow publish.yml --event workflow_dispatch
gh run view RUN_ID --json headSha,conclusion,jobs,url
```

| Scenario | Version guard | Validation matrix | release-ready | publish |
| --- | --- | --- | --- | --- |
| success | success | all four pass | success | skipped |
| matrix-failure | success | Node 22.13.0 / TS 5.9.3 deliberately fails after checks | skipped | skipped |
| tag-mismatch | deliberately fails using a mismatched suffix | all four pass | skipped | skipped |

`rehearsal-result` asserts these outcomes and writes a reviewable job summary. The two negative scenarios intentionally leave the overall workflow failed; a successful result assertion confirms the expected failure gate. Record all three run URLs and their `headSha` before relying on the gate for a release. The release CLI's exact-tag acceptance and mismatch/missing-tag rejection are also covered by `test/release.test.ts`; use `node scripts/check-release.ts v0.2.0` on Node 24 for a local check.

### Recorded gate evidence

Verified on October 8, 2026 against reviewed workflow commit [`965039d973ccf7dbed8814868c25fe4ce7655207`](https://github.com/brandonramsey/lint/commit/965039d973ccf7dbed8814868c25fe4ce7655207), on `codex/5-release-gate`. All runs below report that exact `headSha`.

| Run | Observed result |
| --- | --- |
| [Branch CI](https://github.com/brandonramsey/lint/actions/runs/37884094575) | Full four-job matrix passed. |
| [Success rehearsal](https://github.com/brandonramsey/lint/actions/runs/37884207483) | Version guard, all four matrix jobs, release-ready and result assertion passed; publish skipped. |
| [Matrix-failure rehearsal](https://github.com/brandonramsey/lint/actions/runs/37884209987) | Only the deliberate failure step in Node 22.13.0 / TS 5.9.3 failed; the other three matrix jobs and version guard passed. Gate and publish skipped; result assertion passed. |
| [Tag-mismatch rehearsal](https://github.com/brandonramsey/lint/actions/runs/37884212640) | Version guard failed at the tag check; all four matrix jobs passed. Gate and publish skipped; result assertion passed. |

Local typechecking, self-lint, all 21 tests, reference drift checks and actionlint 1.7.12 also passed. These runs establish gate behavior for the recorded commit. Every authorized version-tag release must rerun the matrix for its own SHA. npm bootstrap and the new package's trusted-publisher account binding were still unverified at this rehearsal; the later [0.2.0 publication evidence](#published-020-evidence) supersedes that pending status.

## Identity cutover evidence

Checks on October 8, 2026:

- The repository was renamed from `brandonramsey/bramsey-eslint` to `brandonramsey/lint`, retaining repository ID `1409414543`. It is public and owned by `brandonramsey`; the authenticated GitHub account has admin permission.
- Before the rename, GitHub returned 404 for `brandonramsey/lint`.
- After the rename, the old GitHub API repository path resolves to `brandonramsey/lint` with the same ID; issue #4 and its blocking relationships to #2/#3 remain present. The checkout's `origin` now uses `https://github.com/brandonramsey/lint.git`.
- The old repository web URL now redirects to `https://github.com/brandonramsey/lint` with HTTP 200. The new repository and issue #4 web links return 200. An earlier request to the old issue URL returned 404 immediately after the rename; the October 9 recheck below records the remaining legacy-link limitation.
- The GitHub `npm` environment exists with no protection rules.
- The public npm registry returned 404 for `@brandonramsey/lint`. This does not establish scope ownership or permission to reserve the name.
- `npm whoami` initially returned 401. After maintainer login it returned `brandonramsey`, confirming the intended npm account. The new package still returned 404, and `npm trust list` required a separate 2FA challenge (`EOTP`). Package bootstrap and the new trusted publisher remain unverified and require maintainer account steps.

### October 9 completion audit

The repository implementation already shipped in commit [`9072b86`](https://github.com/brandonramsey/lint/commit/9072b8649db541dfca58a55d10bdac18e25e2220). Issues #2, #3 and #14 are closed. The [published 0.2.0 evidence](#published-020-evidence) supersedes the October 8 bootstrap status above.

Rechecked on October 9, 2026 for [issue #4](https://github.com/brandonramsey/lint/issues/4):

- Both GitHub API repository names resolve to public `brandonramsey/lint`, ID `1409414543`, and the authenticated account retains admin permission. Issue #4 retains its native dependencies on closed issues #2 and #3. The local remote and tracker guidance use the canonical name.
- The old repository web URL redirects to the canonical repository with HTTP 200. Canonical issue links for [#4](https://github.com/brandonramsey/lint/issues/4) and [#14](https://github.com/brandonramsey/lint/issues/14) return 200. The old #4 URL returned 200 once, then 404 on subsequent requests; the old #14 URL returned 404. Legacy issue redirects are unreliable in these observations. Use canonical links for current work; original links remain in dated planning and research records.
- Registry metadata, tarball SHA-512 integrity and provenance still match `@brandonramsey/lint@0.2.0`, commit `36941f4cd6e71966786fd6ca608ef773a348e355`, repository `brandonramsey/lint` and `.github/workflows/publish.yml`. The recorded tag workflow still reports successful version, four-job matrix, release gate and publication results. Historical `@brandonramsey/eslint@0.1.0` remains available.
- Package and lockfile identity, public repository metadata, basic/editable example imports, generated references, plugin metadata and test temporary-directory prefixes use the new identity. Remaining old branding belongs to historical releases, research, approved drafts and the isolated legacy ESLint implementation. Current ESLint mentions identify bundled upstream providers, rule namespaces or migration limitations.
- `npm run check` passed: typechecking, repository self-lint, all 21 public-contract tests and reference drift checks for 14 profiles with 982 rules each. The separate packed public-contract check also passed; it checks the new identity, public access, metadata, exports, declarations, plugin paths and editable example directly without installing a consumer or running Oxlint.

The GitHub `npm` environment still exists. Reading the current npm trusted-publisher settings with `npm trust list @brandonramsey/lint --json` returned `EOTP`; this audit could not inspect the current binding. Successful release provenance establishes the recorded publication, not the current account configuration. The remaining maintainer check is to complete 2FA in their own terminal and confirm repository `brandonramsey/lint`, workflow `publish.yml`, environment `npm` and direct publication allowed, using step 3 below. Keep the OTP and credentials out of source and chat. No new publication or publisher change is needed for this audit.

## One-time npm setup

The following procedure records the setup path for the first release. `0.2.0` is now public; do not repeat the name-reservation/bootstrap steps for this package. A new publisher was subject to a two-day first-publication deadline during setup. Verify the current [trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/) and [staging instructions](https://docs.npmjs.com/staged-publishing/) before reusing this procedure for another identity or reconfiguring a publisher.

1. Run `npm login` in your terminal, complete the browser/2FA challenge in npm's own interface, and verify `npm whoami`. Verify that account controls the `@brandonramsey` scope and enable account-level 2FA. Keep credentials out of source and chat.
2. Check `npm view @brandonramsey/lint name version` again. If the name remains absent, reserve it through staging with a disposable bootstrap version. Create a temporary directory outside the checkout containing only this `package.json`:

   ```json
   {
     "name": "@brandonramsey/lint",
     "version": "0.0.0-bootstrap.0",
     "description": "Unapproved identity bootstrap for @brandonramsey/lint",
     "license": "ISC",
     "repository": {
       "type": "git",
       "url": "git+https://github.com/brandonramsey/lint.git"
     },
     "publishConfig": { "access": "public" }
   }
   ```

   Review and explicitly authorize the bootstrap before running `npm stage publish --access public --tag bootstrap` from that directory. Staging a new name creates a public `0.0.0-stage` placeholder; the bootstrap prerelease remains pending approval. Record the stage ID and verify package control in npm. Leave the bootstrap unapproved. Use the disposable version to keep staging separate from `0.2.0`, the first intended policy release from the gated GitHub workflow. See [staging tag behavior](https://docs.npmjs.com/cli/v11/commands/npm-stage/#tag-behavior).
3. Configure the publisher for the new package. The final binding is GitHub user `brandonramsey`, repository `lint`, workflow filename `publish.yml`, environment `npm`, with direct publication allowed. Use npm's package settings → Trusted Publisher → GitHub Actions, or the equivalent CLI:

   ```fish
   npm trust github @brandonramsey/lint --repo brandonramsey/lint --file publish.yml --env npm --allow-publish --yes
   npm trust list @brandonramsey/lint --json
   ```

   Complete any 2FA challenge in npm's own interface. Confirm all four fields in the returned binding. If #5 changes the workflow filename or environment, use its final values. The old package's publisher binding is separate and does not establish trust for the new package.
4. Review the GitHub [npm environment](https://github.com/brandonramsey/lint/settings/environments) and desired reviewer protection. The publish job must use that exact environment, a GitHub-hosted runner and `id-token: write`. Node 24 and npm 11.19 meet the current trusted publishing tooling requirements independently of the consumer runtime.
5. Review the packed artifact's name, version, public access, repository URL and assets. Provenance requires the new repository URL in package metadata and a public package/repository. Verify the publisher again immediately before the authorized release.

## Each release

1. Review policy/runtime changes against the versioning contract. Update package.json and lockfile versions together; choose a new version and matching tag after the published `0.2.0` / `v0.2.0` release.
2. Run `npm run check`, review generated assets and inspect `npm pack --dry-run`. `npm run test:package` runs packed module/declaration inspection alone without installing a consumer or invoking a lint engine.
3. Verify the non-publishing gate rehearsals for the reviewed workflow and the exact trusted-publisher binding described above. The existing package needs no new bootstrap. Only after explicit release authorization, commit the reviewed release and create/push its matching version tag. The tag workflow reruns all four validation jobs for that exact commit before publishing; prior branch or rehearsal runs cannot replace it.
4. Verify the GitHub publish job, public npm name/version/access, provenance repository/commit, and registry availability. A configured workflow or packed artifact alone does not establish publication.

Ordinary branch pushes never publish. Tags must match package.json's version. After `1.0`, tighter defaults and raised runtime requirements are major changes; optional additions are minor and nonbreaking fixes are patch changes.

## Historical @brandonramsey/eslint release

`v0.1.0` was published by the [successful GitHub workflow](https://github.com/brandonramsey/bramsey-eslint/actions/runs/37699395248). Its output confirmed a direct public publish and signed provenance. npm initially returned 404 while processing the package; a subsequent clean installation from the public registry passed linting, public declaration type checks, and rejection of a floating promise. The consumer explicitly installed only `@brandonramsey/eslint@0.1.0`, `eslint@10.12.0`, and `typescript@6.0.3`.
