# Exhaustive rule references

Generated with ESLint 10.12.0 and the exact plugin versions in package.json. Each of the 14 profiles lists all 1020 available core and shipped-plugin rules, including disabled and deprecated rules. Settings come from ESLint's resolved configuration; ESLint may normalize default options. Omitted rule-internal defaults are not expanded. JSX uses the JavaScript profile; TSX uses the TypeScript profile.

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

These modules export executable rules objects for inspection. They require the plugins registered by the library, and should only be appended as overrides with suitable file patterns. The normal consumer entry point is the package's default config or createConfig, not these snapshots. Additional consumer overrides change the effective settings. Regenerate with npm run references; verify with npm run references:check.
