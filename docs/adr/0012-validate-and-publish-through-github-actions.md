# Validate releases and publish explicit version tags

Use GitHub Actions to verify representative passing and failing cases, every profile, monorepo resolution, generated-reference drift, and installation of the packed package with only ESLint and project TypeScript explicitly present. Check the minimum supported linting Node version, 22.13, and Node 24.

Publish releases only from explicit version tags using npm trusted publishing. This keeps package releases tied to reviewed versions and successful checks rather than ordinary source pushes. Initial account, package, and trusted-publisher setup may require human participation.

The publishing job must satisfy npm's separate tooling requirements and use a GitHub-hosted runner; it need not run on the minimum Node version used by lint compatibility checks. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
