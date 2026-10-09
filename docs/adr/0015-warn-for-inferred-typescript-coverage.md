# Warn for inferred TypeScript coverage

Superseded by [ADR 0018](0018-use-native-typed-project-coverage.md) on October 8, 2026. The maintainer dropped the custom warning and independent coverage inspection, accepting native Oxlint behavior. The original decision below is retained as history.

The maintainer accepted warning and continuing when the planned Oxlint stack checks TypeScript outside a configured project, replacing ADR 0006's hard setup failure for that case. tsgolint can still check those files through inferred programs, but their compiler settings can differ from the consumer's tsconfig; expose that coverage distinction while retaining promise safety and unsafe-value checks. Intentionally syntax-only files remain explicit exceptions, and missing dependencies, invalid configuration, or a failed typed engine remain execution failures.

This decision was approved on October 8, 2026 during issue #1 validation. The current ESLint implementation retains its existing behavior until the migration is implemented. The Oxlint-native configuration and invocation proposal must explain how it will produce the warning and distinguish inferred coverage from intentional syntax-only coverage; merely enabling type-aware mode does not report that distinction.

See [ADR 0006](0006-enable-typed-checks-by-default.md), [ADR 0014](0014-migrate-to-oxlint-and-lint-identities.md), and [the pinned tsgolint source evidence](../research/oxlint-candidate-upstream.md).
