# Release setup

The next public package is `@brandonramsey/lint@0.2.0`, from GitHub `brandonramsey/lint`, with public access. This is a new npm identity, not a rename of a registry package. Version `0.2.0` continues the pre-v1 sequence and avoids reusing the existing historical `v0.1.0` Git tag. Keep historical `@brandonramsey/eslint` releases intact.

Publication requires the full compatibility matrix to pass for the exact tagged commit and a separate explicit release action. The [publish workflow](../.github/workflows/publish.yml) calls the [reusable validation workflow](../.github/workflows/ci.yml) from the same commit, with every checkout pinned to `github.sha`. Its `release-ready` job depends on both the version guard and the entire validation matrix; publication depends on that gate. A failed, cancelled or skipped prerequisite prevents publication. A successful unrelated branch run is never release evidence.

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

## Identity cutover evidence

Checks on October 8, 2026:

- The repository was renamed from `brandonramsey/bramsey-eslint` to `brandonramsey/lint`, retaining repository ID `1409414543`. It is public and owned by `brandonramsey`; the authenticated GitHub account has admin permission.
- Before the rename, GitHub returned 404 for `brandonramsey/lint`.
- After the rename, the old GitHub API repository path resolves to `brandonramsey/lint` with the same ID; issue #4 and its blocking relationships to #2/#3 remain present. The checkout's `origin` now uses `https://github.com/brandonramsey/lint.git`.
- The old repository web URL now redirects to `https://github.com/brandonramsey/lint` with HTTP 200. The new repository and issue #4 web links return 200. An earlier request to the old issue URL returned 404 immediately after the rename; recheck that issue redirect before completing the cutover.
- The GitHub `npm` environment exists with no protection rules.
- The public npm registry returned 404 for `@brandonramsey/lint`. This does not establish scope ownership or permission to reserve the name.
- `npm whoami` initially returned 401. After maintainer login it returned `brandonramsey`, confirming the intended npm account. The new package still returned 404, and `npm trust list` required a separate 2FA challenge (`EOTP`). Package bootstrap and the new trusted publisher remain unverified and require maintainer account steps.

## One-time npm setup

Complete these steps after the GitHub rename and issue #5, close to the intended release. A new publisher currently expires unless its first successful publish occurs within two days. Verify the current [trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/) and [staging instructions](https://docs.npmjs.com/staged-publishing/) when executing account steps.

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

1. Review policy/runtime changes against the versioning contract. Update package.json and lockfile versions together; the first new-name release is planned as `0.2.0` with tag `v0.2.0`.
2. Run `npm run check`, review generated assets and inspect `npm pack --dry-run`. `npm run test:package` runs packed module/declaration inspection alone without installing a consumer or invoking a lint engine.
3. Verify the non-publishing gate rehearsals for the reviewed workflow. Complete npm bootstrap and verify the exact trusted-publisher binding described above. Only after explicit release authorization, commit the reviewed release and create/push its matching version tag. The tag workflow reruns all four validation jobs for that exact commit before publishing; prior branch or rehearsal runs cannot replace it.
4. Verify the GitHub publish job, public npm name/version/access, provenance repository/commit, and registry availability. A configured workflow or packed artifact alone does not establish publication.

Ordinary branch pushes never publish. Tags must match package.json's version. After `1.0`, tighter defaults and raised runtime requirements are major changes; optional additions are minor and nonbreaking fixes are patch changes.

## Historical @brandonramsey/eslint release

`v0.1.0` was published by the [successful GitHub workflow](https://github.com/brandonramsey/bramsey-eslint/actions/runs/37699395248). Its output confirmed a direct public publish and signed provenance. npm initially returned 404 while processing the package; a subsequent clean installation from the public registry passed linting, public declaration type checks, and rejection of a floating promise. The consumer explicitly installed only `@brandonramsey/eslint@0.1.0`, `eslint@10.12.0`, and `typescript@6.0.3`.
