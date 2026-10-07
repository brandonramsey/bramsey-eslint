# Export a default config array and named factory as ESM

The package will expose an ESM default flat-config array for simple projects and a named `createConfig` factory for project roots, syntax-only file patterns, and import-resolution options. Consumers can append ordinary ESLint overrides. A default array keeps initial adoption concise, while the factory supplies the customization needed by monorepos without requiring consumers to assemble parsers or plugins themselves.

Examples use `eslint.config.mjs` so loading the consumer configuration does not require an extra TypeScript config-loader dependency. A CommonJS package entry is outside the first-release interface.

Consuming application code may use ESM or CommonJS, selected through file extensions and project settings. Rules that require ESM must be scoped appropriately so they do not reject valid CommonJS projects.
