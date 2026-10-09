# Validate releases and publish explicit version tags

Use GitHub Actions to verify representative passing and failing cases, every profile, monorepo resolution, generated-reference drift, and installation of the packed package with only ESLint and project TypeScript explicitly present. Check the minimum supported linting Node version, 22.13, and Node 24.

Publish releases only from explicit version tags using npm trusted publishing. This keeps package releases tied to reviewed versions and successful checks rather than ordinary source pushes. Initial account, package, and trusted-publisher setup may require human participation.

The publishing job must satisfy npm's separate tooling requirements and use a GitHub-hosted runner; it need not run on the minimum Node version used by lint compatibility checks. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Oxlint release gate

On October 8, 2026, issue #5 replaces the historical ESLint matrix with Node 22.13/24 and TypeScript 5.9.3/6.0.3, retaining the exact supported Oxlint/tsgolint pair. [ADR 0017](0017-publish-configuration-and-plugins-without-a-runner.md) supersedes the behavior/consumer-execution tests above: validation now checks the public package contract and packed modules/declarations/assets, with repository self-lint as a development check.

Branch/PR CI and tag releases share a reusable workflow from the triggering commit. The release gate depends on both exact version-tag matching and successful completion of the entire matrix; every release checkout uses the triggering SHA. Only tag pushes can reach the publishing job. Manual success, matrix-failure and tag-mismatch rehearsals exercise the same prerequisites without publishing. The publisher retains `publish.yml`, environment `npm`, public access and provenance; account bootstrap/binding verification remains a maintainer step. See [release setup](../releasing.md) for the matrix and reviewable gate-verification procedure.
