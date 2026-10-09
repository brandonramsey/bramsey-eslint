# Enable type-aware checks by default for TypeScript

TypeScript receives type-aware checks by default to support the strict correctness policy, accepting the additional project-configuration requirements and linting cost. Files intentionally outside a TypeScript project receive syntax-only checks through explicit file patterns in the consuming configuration. An unexpectedly excluded TypeScript source file must produce a setup error rather than silently lose type-aware checks. TypeScript project service does not provide automatic syntax-only fallback.

See the official [typed-linting setup](https://typescript-eslint.io/getting-started/typed-linting/) and [out-of-project file constraints](https://typescript-eslint.io/troubleshooting/typed-linting/).

For the Oxlint implementation, [ADR 0018](0018-use-native-typed-project-coverage.md) accepts native project selection and inferred checks without a package-owned coverage warning or compiler inspection. It supersedes [ADR 0015](0015-warn-for-inferred-typescript-coverage.md)'s intermediate warning requirement. The legacy ESLint implementation still enforces the original setup error.
