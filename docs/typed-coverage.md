# Inferred TypeScript coverage

The native configuration enables `policy/inferred-typed-coverage` at warning severity for `.ts`, `.tsx`, `.mts` and `.cts` files that receive typed checks. Declaration files and explicit `syntaxOnlyFiles` patterns disable both the warning and typed rules. Promise safety and unsafe-value checks remain enabled on inferred files; a warning does not turn them into syntax-only files.

Consumers invoke their peer-installed Oxlint, select files, and decide whether warnings fail their command. The factory does not set `denyWarnings` or `maxWarnings`. Consumer `overrides` are appended last and may change the rule's severity. Keep the canonical working directory, explicit config location and linted paths aligned with `projectRoot`, as required by the native configuration's file patterns.

## Project selection

The bundled rule starts with the file's nearest conventional `tsconfig.json` or `jsconfig.json`. It checks that project's configured root inputs, then its references in breadth-first order, then conventional configs in ancestor directories. References may use nonstandard JSON filenames. Without a conventional starting config, unrelated custom configs do not establish typed coverage. `disableSolutionSearching` does not stop an ancestor search when no membership fallback exists in the pinned engine.

Configured root inputs differ from transitive compiler-program inclusion: an excluded file imported by a configured source can still receive inferred settings. `resolverOptions.project` and Oxlint's `--tsconfig` select import-resolution settings; they do not select the typed project or suppress this warning.

This follows [tsgolint 7.0.2003's resolver](https://github.com/oxc-project/tsgolint/blob/v7.0.2003/internal/utils/find_tsconfig.go), with the [recorded source and configuration evidence](research/oxlint-candidate/configuration-contract-sources.md). The warning reports missing root membership; it does not expose the typed engine's compiler program or replace compiler diagnostics.

## Configuration inspection and refresh

`typescript-coverage` is a bundled npm alias for TypeScript 7.0.2, the compiler used in the migration research. Its revision matches the compiler embedded in pinned tsgolint. This inspection provider is independent of the consumer's TypeScript dependency and the repository's development compiler.

Before expanding a reachable project's metadata, the rule invokes that provider's `--build --dry`, then `--showConfig --project`. The dry build validates configuration and references without emitting or checking source types. Expansion supplies inherited `files`, `include` and `exclude` membership. Malformed configuration, missing references, inaccessible files and inspection failures throw setup errors instead of producing inferred warnings. No `--listFilesOnly` or compiler program is created by the rule.

Inspection state belongs to one file's rule context, with canonical paths and the canonical `projectRoot`; no process-global membership snapshot is reused. Each file therefore sees current source lists, inherited configurations and references, including in subsequent editor lint requests. This deliberately trades cross-file reuse for refresh without relying on undocumented lint-run hooks: each visited project requires two compiler subprocesses per checked file. An inspection subprocess has a 30-second timeout and a 16 MiB output limit. The package supplies no executable, execution helper or independent preflight.

Permanent tests verify the public plugin export, warning severity, exemptions, override precedence, bundled dependency and packaged assets. The existing research supplies selection and refresh evidence; no typed-engine diagnostic or internal lifecycle test suite is added. See [ADR 0015](adr/0015-warn-for-inferred-typescript-coverage.md) and [ADR 0017](adr/0017-publish-configuration-and-plugins-without-a-runner.md).
