# Changelog

## 1.0.0-rc.1

Prepare the first v1 release candidate from the core policy approved in issue #7. Runtime configuration, plugins, dependencies and generated reference profiles are unchanged from `0.2.0`.

Publish this prerelease under npm's `next` tag for manual consumer validation. The default `latest` release remains `0.2.0`; stable `1.0.0` publication requires a separate decision after that validation.

## 0.2.0

Add native Oxlint configuration, bundled style/policy plugins, strict TypeScript tooling and public package contract checks for the first `@brandonramsey/lint` release. Update current imports, generated examples and package metadata for GitHub `brandonramsey/lint`.

Gate tag publication on shared four-job Node/TypeScript validation of the exact tagged commit and an exact version-tag check. Add non-publishing success, matrix-failure and tag-mismatch rehearsals; retain public access, trusted publishing and provenance for the new identity. npm bootstrap and publisher verification remain prerequisites to the first release.

Keep public resolver options independent of private provider declarations. Strict compilation of all packed public exports now passes with TypeScript 5.9.3, 6.0.3 and 7.0.2 in the isolated consumer, preserving the existing options and emitted runtime code.

## 0.1.0 — @brandonramsey/eslint

Initial strict, framework-neutral Node TypeScript configuration with bundled lint extensions, formatting, typed checks, automatic test relaxations, syntax-only exceptions, handwritten declarations, and CommonJS/ESM support. Includes exhaustive generated rule references and CI validation of packed consumer installations.
