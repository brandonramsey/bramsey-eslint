# Historical ESLint rule references

These snapshots describe the former ESLint policy, not the native Oxlint configuration now exported by this checkout. Do not append them as Oxlint overrides: owners, options and profiles differ. Native inventory and a complete generated editable Oxlint example are tracked in #14. Use the [basic consumer example](basic-config.mjs) and [current interface](../docs/oxlint-configuration.md) today; see [support boundaries](../docs/support.md) for native typed coverage and unenforced disable-comment descriptions.

Generated with the development-only legacy policy, ESLint 10.12.0 and the exact plugin versions in package.json. Each of the 14 profiles lists all 1020 historical core and plugin rules, including disabled and deprecated rules. Settings come from ESLint's resolved configuration; ESLint may normalize default options. Omitted rule-internal defaults are not expanded. JSX uses the JavaScript profile; TSX uses the TypeScript profile.

| Profile | Representative file | Enabled rules |
| --- | --- | --- |
| [javascript-esm](rules/javascript-esm.mjs) | src/source.js | 205 |
| [javascript-commonjs](rules/javascript-commonjs.mjs) | src/source.cjs | 205 |
| [javascript-test-esm](rules/javascript-test-esm.mjs) | src/source.test.js | 201 |
| [javascript-test-commonjs](rules/javascript-test-commonjs.mjs) | src/source.test.cjs | 201 |
| [typescript-esm](rules/typescript-esm.mjs) | src/source.ts | 267 |
| [typescript-commonjs](rules/typescript-commonjs.mjs) | src/source.cts | 267 |
| [typescript-test-esm](rules/typescript-test-esm.mjs) | src/source.test.ts | 253 |
| [typescript-test-commonjs](rules/typescript-test-commonjs.mjs) | src/source.test.cts | 253 |
| [typescript-syntax-esm](rules/typescript-syntax-esm.mjs) | tools/config.ts | 224 |
| [typescript-syntax-commonjs](rules/typescript-syntax-commonjs.mjs) | tools/config.cts | 224 |
| [typescript-syntax-test-esm](rules/typescript-syntax-test-esm.mjs) | tools/config.test.ts | 216 |
| [typescript-syntax-test-commonjs](rules/typescript-syntax-test-commonjs.mjs) | tools/config.test.cts | 216 |
| [declarations-esm](rules/declarations-esm.mjs) | src/ambient.d.ts | 111 |
| [declarations-commonjs](rules/declarations-commonjs.mjs) | src/ambient.d.cts | 111 |

These executable modules are retained for historical inspection; the package no longer exports their ESLint plugin registration. Regenerate with npm run references; verify historical snapshot drift with npm run references:check. Native generation belongs to #14.
