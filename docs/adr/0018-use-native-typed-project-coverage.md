# Use native typed-project coverage

On October 8, 2026, the maintainer accepted Oxlint and oxlint-tsgolint's native project selection, inferred programs and diagnostics. The package enables typed safety rules and retains explicit declaration/syntax-only exemptions, but performs no independent TypeScript coverage discovery, compiler-configuration inspection or custom inferred-coverage warning.

This supersedes [ADR 0015](0015-warn-for-inferred-typescript-coverage.md) and the warning obligation in [ADR 0017](0017-publish-configuration-and-plugins-without-a-runner.md). Repeating the engine's project discovery adds compiler subprocesses and risks disagreement with native selection; the custom warning does not justify that cost or maintenance. Issue #11 is withdrawn rather than deferred pending an upstream feature. Import-resolver project selection remains a separate package responsibility.
