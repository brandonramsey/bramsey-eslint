# Native Oxlint rule reference

Copy [complete-config.mjs](complete-config.mjs) to your project root as `oxlint.config.mjs`, then run `npx oxlint --config oxlint.config.mjs .` from that root. The unedited example reproduces this package's defaults. It uses the public `createConfig` export to derive consumer paths, package-aware globals, bundled plugin loading and profile selections. No repository or fixture roots are embedded. The [basic example](basic-config.mjs) remains the shortest default setup.

Edit explicit entries in `rules` for base settings. Edit the named `syntax`, `typed`, `declarations`, `tests` or `syntaxOnly` maps where a profile overrides that setting. For example, change `'style/semi'` in `rules` to `['error', 'never']`; change typed promise options in `typed`. Root edits do not override later profile entries. Keep `createConfig` and the composition code to retain default plugin setup. Pass factory options to the final `createExample` call for explicit roots, `syntaxOnlyFiles`, `testFiles`, `tests: false`, resolver options or final consumer overrides; see [the public interface](../docs/oxlint-configuration.md). Each call clones settings so edits to one result do not leak into another.

Generated from Oxlint 1.87.0's pinned schema and public packaged plugin exports (Stylistic 5.10.0). Each of the 14 profiles lists all 982 available rules: 871 native identities across all native owners, 97 style rules and 14 selected policy bridge rules. Rules from inactive native owners remain explicitly off; enabling one also requires adding its owner to `plugins`. Core rules use the explicit `eslint/` owner. Providers used privately by the bridge are not separately registered rule namespaces.

Reference profiles resolve ordered public rules, globals and environment overrides for representative files, with configured options intact. Omitted internal defaults are not expanded. Dedicated extensions represent ESM/CommonJS independently of the generation checkout. JSX uses JavaScript settings; TSX uses TypeScript settings. The example retains dynamic nearest-package settings for ambiguous extensions. The profile modules are reference snapshots, not standalone configurations; their root-dependent import settings and plugin specifiers come from the factory in the complete example.

| Profile | Representative file | Enabled rules |
| --- | --- | --- |
| [javascript-esm](rules/javascript-esm.mjs) | src/source.mjs | 203 |
| [javascript-commonjs](rules/javascript-commonjs.mjs) | src/source.cjs | 203 |
| [javascript-test-esm](rules/javascript-test-esm.mjs) | src/source.test.mjs | 199 |
| [javascript-test-commonjs](rules/javascript-test-commonjs.mjs) | src/source.test.cjs | 199 |
| [typescript-esm](rules/typescript-esm.mjs) | src/source.mts | 265 |
| [typescript-commonjs](rules/typescript-commonjs.mjs) | src/source.cts | 265 |
| [typescript-test-esm](rules/typescript-test-esm.mjs) | src/source.test.mts | 251 |
| [typescript-test-commonjs](rules/typescript-test-commonjs.mjs) | src/source.test.cts | 251 |
| [typescript-syntax-esm](rules/typescript-syntax-esm.mjs) | tools/config.mts | 222 |
| [typescript-syntax-commonjs](rules/typescript-syntax-commonjs.mjs) | tools/config.cts | 222 |
| [typescript-syntax-test-esm](rules/typescript-syntax-test-esm.mjs) | tools/config.test.mts | 214 |
| [typescript-syntax-test-commonjs](rules/typescript-syntax-test-commonjs.mjs) | tools/config.test.cts | 214 |
| [declarations-esm](rules/declarations-esm.mjs) | src/ambient.d.mts | 105 |
| [declarations-commonjs](rules/declarations-commonjs.mjs) | src/ambient.d.cts | 105 |

Native Oxlint/tsgolint owns typed-project selection and inferred programs; no custom coverage warning or independent preflight is supplied. Declaration and explicit syntax-only selections disable configured typed rules. Disable-comment explanations are recommended but unenforced; unused-directive errors and blanket-disable rejection remain configured. Consumers own execution and repeated fixing. See [support boundaries](../docs/support.md).

Run `npm run references` to regenerate, then review and commit the example, profiles and this summary. `npm run references:check` strictly builds the TypeScript generator and fails for any stale or missing generated output, including the complete example and summary. Generation reads metadata and public configuration; it executes no lint engine or per-rule probes. Public tests verify example equivalence, profile settings, inventory and drift. The full development check is `npm run check`.
