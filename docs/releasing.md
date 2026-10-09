# Release setup

The setup and first-release evidence below describe the historical ESLint `0.1.0` release. The current checkout exports Oxlint configuration; its support contract is in [support boundaries](support.md). Identity cutover (#4) and release workflow migration (#5) remain separate tickets. Existing GitHub Actions still carry the old ESLint/TypeScript matrix; its environment variables no longer select a temporary consumer. Do not treat it as evidence for an Oxlint runtime matrix. Use `npm run check` and `npm run test:package` for current public package verification; `test:consumer` is only a compatibility alias. The unchanged publication procedure below is historical pending that workflow work.

The intended public package is `@brandonramsey/eslint`, version `0.1.0`, from the public GitHub repository `bramsey-eslint`. Registry availability does not establish scope ownership or publishing permission.

## One-time setup

1. Verify the npm account has publishing permission for the `@brandonramsey` scope and enable account-level 2FA. If no package exists, reserve its name using a disposable bootstrap version through npm staging. Do not stage the intended release version: staged versions reserve their version number. Never approve the disposable bootstrap; the real release comes from GitHub Actions. Keep credentials out of source and logs.
2. Configure an npm trusted publisher for `brandonramsey/bramsey-eslint`, `publish.yml`, and the `npm` environment. With a recent npm CLI, run `npm trust github @brandonramsey/eslint --repo brandonramsey/bramsey-eslint --file publish.yml --env npm --allow-publish --yes`, completing any 2FA challenge in npm's own interface. Verify it with `npm trust list @brandonramsey/eslint`. Current npm setup may expire if no successful publish occurs within two days.
3. Configure the GitHub `npm` environment and any desired reviewer protection. The workflow requires `id-token: write`; no npm token secret is needed for trusted publishing.
4. Ensure package.json's repository URL matches the public GitHub repository and review all files in `npm pack --dry-run`.

Use npm's current [trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) and [staged publishing documentation](https://docs.npmjs.com/staged-publishing/) during bootstrap. The workflow uses Node 24 and npm 11.19, meeting the newer publishing requirements separately from the consumer's linting runtime.

## Each release

1. Review rule or runtime changes against the versioning contract. Update package.json and lockfile versions together.
2. Run `npm run check` and `npm run test:consumer`, and review reference changes and `npm pack --dry-run`.
3. Commit the reviewed release, then create and push the matching explicit version tag. The first tag is `v0.1.0`.
4. Verify the GitHub publish job, npm package metadata/provenance, and installation from the public registry. A configured workflow alone does not establish that the package is published.

Ordinary branch pushes never publish. Tags must match package.json's version. After `1.0`, tighter defaults and raised runtime requirements are major changes; optional additions are minor and nonbreaking fixes are patch changes.

## First-release verification

`v0.1.0` was published by the [successful GitHub workflow](https://github.com/brandonramsey/bramsey-eslint/actions/runs/37699395248). Its output confirmed a direct public publish and signed provenance. npm initially returned 404 while processing the package; a subsequent clean installation from the public registry passed linting, public declaration type checks, and rejection of a floating promise. The consumer explicitly installed only `@brandonramsey/eslint@0.1.0`, `eslint@10.12.0`, and `typescript@6.0.3`.
