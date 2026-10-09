# Shared lint policy

Language for the common linting expectations supplied by this package.

## Language

**Core policy**:
The common linting expectations intended for all projects supported by this package, independent of their application framework.
_Avoid_: Framework rules

**Rule reference**:
The exhaustive inventory of rules available from the selected lint engine and the plugins supplied by this package, including disabled rules and their policy settings.
_Avoid_: Enabled-rule list

**Reference profile**:
A representative file category whose resolved policy settings appear in the rule reference, such as JavaScript or TypeScript.
_Avoid_: Universal rule list

**Policy plugin**:
The bundled compatibility plugin supplying import, runtime and selected core rules missing from the native policy, including scoped export inspection.

**Typed engine**:
Bundled oxlint-tsgolint, which uses its embedded typescript-go compiler for typed rules. It is separate from the consumer's installed TypeScript compiler and import-resolver project selection.

**Syntax-only exception**:
An explicit file-pattern selection disabling the configured typed rules. Handwritten declarations also receive syntax-only settings; a native inferred program is not a syntax-only exception.
