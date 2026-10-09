# Supply all lint extensions through the package

The implemented Oxlint dependency contract in [ADR 0017](0017-publish-configuration-and-plugins-without-a-runner.md) supersedes the ESLint peer and shared-compiler arrangement below: Oxlint is the core peer, required providers and tsgolint are bundled dependencies, and tsgolint's compiler is separate from consumer TypeScript. See [current support boundaries](../support.md). The original first-release decision is retained as history.

Consumers install this package and ESLint; they must not separately install parsers, plugins, or other ruleset-extending packages. This package owns those dependencies. TypeScript belongs to the consuming TypeScript project so linting can use the same compiler version as the project's build and editor, rather than a compiler selected by this package.

ESLint documents this [dependency arrangement for shareable configurations](https://eslint.org/docs/latest/extend/shareable-configs). typescript-eslint recommends [matching the project's compiler version](https://typescript-eslint.io/troubleshooting/faqs/typescript/).
