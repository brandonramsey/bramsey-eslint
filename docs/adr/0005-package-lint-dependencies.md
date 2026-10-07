# Supply all lint extensions through the package

Consumers install this package and ESLint; they must not separately install parsers, plugins, or other ruleset-extending packages. This package owns those dependencies. TypeScript belongs to the consuming TypeScript project so linting can use the same compiler version as the project's build and editor, rather than a compiler selected by this package.

ESLint documents this [dependency arrangement for shareable configurations](https://eslint.org/docs/latest/extend/shareable-configs). typescript-eslint recommends [matching the project's compiler version](https://typescript-eslint.io/troubleshooting/faqs/typescript/).
