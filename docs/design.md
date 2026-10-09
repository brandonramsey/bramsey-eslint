# Shared lint policy design

Status: this checkout implements native Oxlint configuration and bundled plugins under the existing `@brandonramsey/eslint` identity, with strictly checked TypeScript tooling, public-contract tests and a generated editable configuration. The published ESLint `0.1.0` release is historical. Identity cutover (#4) and release workflows (#5) remain separate work.

## Goal and public boundary

Supply a strict, explicitly curated core policy for Node TypeScript projects and their JavaScript, JSX/TSX and handwritten declarations. Consumers install the configuration package and the exact Oxlint peer. The package supplies every required plugin/provider and tsgolint; consumers own invocation, file selection, fixing and exit handling. It exports no executable, execution helper or independent preflight.

The compiled ESM default is one `OxlintConfig` object. `createConfig` accepts explicit roots, file patterns, resolver options and native overrides. Public declarations expose `ConfigOptions`, `ResolverOptions`, `OxlintConfig` and `OxlintOverride`; `plugins/style` and `plugins/policy` expose the bundled modules. See [the interface](oxlint-configuration.md) and [support evidence](support.md).

## Current decisions

1. [Framework-neutral Node TypeScript projects](adr/0001-framework-neutral-first-release.md), with application APIs targeting [Node 24+](adr/0010-default-application-target-node-24.md). Standalone JavaScript and browser presets remain outside the promise.
2. [Explicit strict policy](adr/0002-explicit-strict-and-opinionated-policy.md), with [Stylistic as formatting authority](adr/0013-use-stylistic-in-the-planned-oxlint-stack.md) and no Oxfmt. [Rule policy](rule-policy.md) describes semantic choices and migration differences.
3. [Native Oxlint configuration](adr/0014-migrate-to-oxlint-and-lint-identities.md), superseding the ESLint engine/flat-array contract in ADRs 0007/0009. The name cutover remains pending; third-party names and historical releases stay accurate.
4. [Configuration and bundled plugins without a runner](adr/0017-publish-configuration-and-plugins-without-a-runner.md), superseding the runner/preflight obligation and ADR 0005's dependency arrangement. Oxlint is a peer; ESLint is an exact bundled bridge provider. Consumer TypeScript is distinct from tsgolint's embedded compiler.
5. [Native typed-project coverage](adr/0018-use-native-typed-project-coverage.md): retain typed safety and explicit syntax-only/declaration exemptions, accept native inferred programs and diagnostics, and emit no custom warning or independent compiler inspection. ADR 0015 and issue #11 are withdrawn. Import-resolver discovery remains separate.
6. [Native parsing with package-aware policy](adr/0016-use-native-parsing-with-package-aware-policy.md): nearest package boundaries, explicit patterns and dedicated extensions select globals and policy, without forcing parser/scope modes. Preserve [workspace aliases and references](adr/0008-support-monorepos-and-project-references.md) through the import bridge.
7. Automatic relaxed test settings retain formatting, import and promise checks. Declarations permit augmentation constructs while retaining syntax-level `any` rejection. Consumer overrides have final precedence.
8. Enabled rules are errors. Unused disables and blanket-disable rejection remain configured; disable-comment descriptions are recommended but unenforced under ADR 0017. Consumers manage observed multi-pass fixes.
9. The policy plugin retains missing import/runtime/core providers and scoped guarded export inspection. Child parsing is limited to export-name inspection; it promises no general ESLint parser compatibility. Packed imports verify the pinned unsupported ESLint core-provider entry point.
10. [Exhaustive references](adr/0004-exhaustive-rule-reference.md) supply native inventories and configured settings for every reference profile, plus an [editable generated configuration](../examples/complete-config.mjs) preserving the default policy. The generator reads pinned metadata and public configuration/plugin exports without lint-engine probes; generation drift is part of the development check.
11. [ISC and pre-v1 stabilization](adr/0011-stabilize-the-policy-before-one-point-zero.md) remain. [Tag-based release history](adr/0012-validate-and-publish-through-github-actions.md) is preserved, with migration workflow work in #5.

## Verification boundary

Tests cover public exports/declarations, configured rules/options, factory composition/validation, plugin exports/specifiers, dependency metadata, packed assets and example equivalence/drift. They inspect built and unpacked modules directly, without installing a consumer or executing Oxlint. Assume upstream engines and rules work; research fixtures are historical evidence, not a permanent upstream behavior suite. Self-lint remains a development check.

Repository commands build the public package before compiling TypeScript configuration, the reference generator and tests to local JavaScript. The compiled Oxlint configuration is placed at the repository root to preserve relative pattern semantics; tests execute from `.tooling/test/` and locate fixtures/assets in the source checkout. Strict checking includes package sources, maintained repository tooling, contract tests and the public API fixture. Generated consumer assets retain their `.mjs` formats and receive drift checks.

TypeScript 6.0.3 checks the build and public declarations with full library checking. The retained typescript-eslint family blocks a toolchain upgrade to stable TypeScript 7.0.2; tsgolint separately embeds a compiler targeting 7.0.2. Runtime support is derived from published dependency contracts, and local verification uses Node 24.21.0. No new engine/compiler compatibility matrix is claimed. See [support boundaries](support.md) for pins, evidence and limitations.
