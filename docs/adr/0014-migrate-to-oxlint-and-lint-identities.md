# Migrate to Oxlint and the lint project identities

The next pre-v1 implementation will use Oxlint with oxlint-tsgolint and Stylistic, native id-match for simplified naming, and no Oxfmt, under GitHub `brandonramsey/lint` and npm `@brandonramsey/lint`. This direction replaces the planned engine/interface in [ADR 0007](0007-target-eslint-10-flat-config.md) and [ADR 0009](0009-export-default-config-and-factory-as-esm.md) when implemented, while retaining [ADR 0013's style authority](0013-use-stylistic-in-the-planned-oxlint-stack.md), the typed-coverage requirement in [ADR 0006](0006-enable-typed-checks-by-default.md), and monorepo/reference support in [ADR 0008](0008-support-monorepos-and-project-references.md). Validate remaining rule/profile gaps and the JavaScript bridge before shipping; use the highest stable TypeScript supported by the complete stack and identify any single family blocking upgrades.

## Consequences

- [ADR 0015](0015-warn-for-inferred-typescript-coverage.md) revises the planned typed-coverage behavior: warn and continue for inferred projects while retaining typed safety checks and explicit syntax-only exceptions.

- [ADR 0016](0016-use-native-parsing-with-package-aware-policy.md) accepts native parsing and scope analysis while retaining package-aware Node globals and policy selections; file-pattern options do not force parser mode.

- The public configuration must be designed and tested for Oxlint rather than preserving an ESLint flat-config array by assumption.
- Convention scope may be simplified as agreed, but correctness gaps and typed-coverage limitations require explicit resolution or maintainer review.
- On October 8, 2026, the maintainer clarified that disable-comment explanations should remain required whenever the rule can enforce them reliably in the new engine. Optional explanations are a fallback only if reliable enforcement is unavailable, not an unconditional policy removal. The validation prototype retains the requirement through an independent parsed-comment preflight reusing the existing rule; the direct bridge crashes, and clamping permits self-suppression. Integrate this check in the package runner and retain native unused-directive errors and blanket-disable rejection.
- Current branding and publisher bindings must change together; literal third-party package names and historical release records stay accurate.
- The new npm name is a new publication identity. The executable package and external names remain unchanged until implementation/cutover tickets are executed; the user approved the summary and the seven tracking issues were submitted on October 8, 2026.
