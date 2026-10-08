# Retain Stylistic in the planned Oxlint stack

The planned Oxlint migration uses Oxlint for native rules, oxlint-tsgolint for typed correctness, and @stylistic/eslint-plugin through Oxlint's JavaScript plugin API for the existing style policy. Use native id-match for simplified naming and no Oxfmt: individual style rules and fixes remain part of the lint command instead of introducing a separate formatting authority.

This retains the single-authority intent of [ADR 0003](0003-eslint-owns-formatting.md) for the proposed engine change. Validate Stylistic diagnostics and fix stability across supported reference profiles before adopting the candidate; the JavaScript bridge remains alpha and the bounded probes do not establish full parity. The current implementation still follows the ESLint engine and interface decisions in [ADR 0007](0007-target-eslint-10-flat-config.md) and [ADR 0009](0009-export-default-config-and-factory-as-esm.md) until the migration is implemented.
