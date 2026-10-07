# Release setup

The intended public package is `@brandonramsey/eslint`, version `0.1.0`, from the public GitHub repository `bramsey-eslint`. Registry availability does not establish scope ownership or publishing permission.

## One-time setup

1. Verify the npm account has publishing permission for the `@brandonramsey` scope. Bootstrap the package with an authenticated npm direct or staged publish if no package exists. Keep credentials out of source and logs.
2. Configure an npm trusted publisher for the exact GitHub owner, `bramsey-eslint` repository, `publish.yml` workflow filename, and `npm` environment. Allow direct publishing for this workflow if npm initially permits only staged publishing. Current npm setup may expire if no successful publish occurs within two days.
3. Configure the GitHub `npm` environment and any desired reviewer protection. The workflow requires `id-token: write`; no npm token secret is needed for trusted publishing.
4. Ensure package.json's repository URL matches the public GitHub repository and review all files in `npm pack --dry-run`.

Use npm's current [trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) and [staged publishing documentation](https://docs.npmjs.com/staged-publishing/) during bootstrap. The workflow uses Node 24 and npm 11.19, meeting the newer publishing requirements separately from the consumer's linting runtime.

## Each release

1. Review rule or runtime changes against the versioning contract. Update package.json and lockfile versions together.
2. Run `npm run check` and `npm run test:consumer`, and review reference changes and `npm pack --dry-run`.
3. Commit the reviewed release, then create and push the matching explicit version tag. The first tag is `v0.1.0`.
4. Verify the GitHub publish job, npm package metadata/provenance, and installation from the public registry. A configured workflow alone does not establish that the package is published.

Ordinary branch pushes never publish. Tags must match package.json's version. After `1.0`, tighter defaults and raised runtime requirements are major changes; optional additions are minor and nonbreaking fixes are patch changes.
