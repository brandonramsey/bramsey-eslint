# Use native parsing with package-aware policy

The maintainer approved native Oxlint parsing plus package-aware Node globals and policy selection on October 8, 2026 during issue #1 validation. Oxlint cannot force ESLint's per-file parser/scope mode; accepting that boundary keeps the approved native engine architecture while preserving useful package and file-pattern policy choices. This revises ADR 0009's planned source-mode compatibility for the migration; the current ESLint package retains its behavior until implementation.

For ambiguous `.js`, `.jsx`, `.ts` and `.tsx` files, infer policy from the nearest package boundary and allow `commonjsFiles`/`moduleFiles` to select globals and packaged policy settings. Module patterns win overlaps; dedicated `.mjs`/`.mts` and `.cjs`/`.cts` extensions remain authoritative. These options do not change native parsing or scope analysis, including for consumer-added native rules.

Native content-based parsing can change diagnostics: an ambiguous `.js` file in an ESM package containing `this.eval('value')` receives native `no-eval` diagnostics that the configured ESM baseline does not. A parser preflight cannot change the native scope and rejects some syntax the current TypeScript parser accepts, so it is not the compatibility remedy. Full forced-mode parity and an additional ESLint engine architecture were not selected.

See [the configuration evidence](../research/oxlint-candidate/configuration-results.json), [pinned source evidence](../research/oxlint-candidate/configuration-contract-sources.md), and [the implementation proposal](../research/oxlint-candidate/public-interface.md).
