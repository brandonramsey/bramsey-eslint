# Personal assistant compiler assessment

Assessed October 8, 2026 (America/Chicago), against the prepared `@brandonramsey/lint@0.2.0` package. The isolated consumer install exposed a public declaration defect despite compatible compiler and lint execution. The earlier metadata-only assessment that reported no consumer compiler blocker was incomplete.

## Recommendation

Keep the application's **TypeScript 7.0.2** as the execution candidate, but **do not claim the current packed package passes strict public declaration checking**. It is already installed, its manifest requests `^7.0.2`, and the official [TypeScript latest registry metadata](https://registry.npmjs.org/typescript/latest) reports stable `7.0.2` (git head `2bd066d87f5bafd315be9f40889d0a60b9e58e0b`, Node `>=16.20.0`). The typed engine targets this compiler version; application compilation passes and the lint engine completes with policy violations in the accompanying isolated assessment. The package's exposed resolver declaration graph nevertheless has missing and incorrectly resolved dependencies, detailed below. Downgrading TypeScript does not supply a missing declaration dependency.

The lint repository's separate **TypeScript 6.0.3** pin is constrained by its retained development-only `typescript-eslint@8.71.1`: the [tagged manifest](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/v8.71.1/packages/typescript-eslint/package.json) requires `>=4.8.4 <6.1.0`. The package declares neither that family nor a TypeScript compiler as a public dependency. However, adding `@typescript-eslint/utils@8.71.1` to satisfy the exposed declarations introduces that same compiler ceiling into the consumer. The sole assessed compiler-ceiling family remains **typescript-eslint**; its role differs between the existing development installation and the missing consumer declaration dependency. See [support boundaries](../../support.md) and [ADR 0017](../../adr/0017-publish-configuration-and-plugins-without-a-runner.md).

## Exact stack and evidence

| Component | Assessed contract | Implication |
| --- | --- | --- |
| `oxlint@1.87.0` | [Tagged manifest](https://raw.githubusercontent.com/oxc-project/oxc/oxlint_v1.87.0/npm/oxlint/package.json): optional typed-engine peer `oxlint-tsgolint >=7.0.2003`; Node `^20.19.0 || >=22.12.0`; no TypeScript compiler peer | Supplied typed engine satisfies the peer; Node 24.21.0 satisfies the runtime. |
| `oxlint-tsgolint@7.0.2003` | [Tagged README](https://raw.githubusercontent.com/oxc-project/tsgolint/v7.0.2003/README.md): version prefix `7.0.2` identifies its TypeScript target; final `003` is its patch suffix. [Tagged architecture](https://raw.githubusercontent.com/oxc-project/tsgolint/v7.0.2003/ARCHITECTURE.md): native typescript-go with pinned compiler internals | Typed rules target TypeScript 7.0.2. Installing a different application compiler does not replace the embedded compiler. |
| `@stylistic/eslint-plugin@5.10.0` | [Tagged manifest](https://raw.githubusercontent.com/eslint-stylistic/eslint-stylistic/v5.10.0/packages/eslint-plugin/package.json): ESLint peer `^9.0.0 || ^10.0.0`; Node `^18.18.0 || ^20.9.0 || >=21.1.0`; dependency on `@typescript-eslint/types`, no TypeScript compiler or parser peer | ESLint 10.12.0 satisfies the contract. The types-only dependency does not impose the parser family's compiler ceiling. |
| `eslint@10.12.0` | [Tagged manifest](https://raw.githubusercontent.com/eslint/eslint/v10.12.0/package.json): Node `^20.19.0 || ^22.13.0 || >=24`; no TypeScript compiler peer | Node 24.21.0 satisfies the bundled provider's runtime. |
| `eslint-plugin-import-x@4.17.1` | [Tagged manifest](https://raw.githubusercontent.com/un-ts/eslint-plugin-import-x/v4.17.1/package.json): direct `@typescript-eslint/types ^8.56.0`; **optional** `@typescript-eslint/utils ^8.56.0` peer | npm may omit utils, but the resolver's exposed declaration graph still imports it through `eslint-import-context`; optional peer metadata does not make that declaration import optional. |
| `eslint-import-resolver-typescript@4.4.5` | Installed manifest: dependencies include `get-tsconfig`, `unrs-resolver` and `eslint-import-context`; no TypeScript compiler dependency or peer | Import-resolver project discovery does not select the typed engine's compiler. |

The local installed `@typescript-eslint/types@8.71.1` manifest has no dependencies or TypeScript peer. In contrast, the lint repository's installed `@typescript-eslint/utils@8.71.1` has the same `>=4.8.4 <6.1.0` compiler peer as the retained development parser family. These were read directly from installed package manifests; the distinction is also visible in the first-party Stylistic and import-x manifests above.

## Actual public declaration blocker

Read-only inspection of the isolated candidate at `/private/tmp/lint-issue6-bto2_mwq/candidate` verified this graph:

1. Packed `dist/index.d.ts` exports `ResolverOptions` through `dist/options.d.ts`, which refers to `eslint-import-resolver-typescript`. The resolver's declaration entry imports `eslint-import-context`.
2. Installed `eslint-import-context@0.1.9/lib/types.d.ts` lines 1–2 import `@typescript-eslint/utils` and `type-fest`. Its own installed manifest declares neither package. npm reports a valid dependency tree while omitting utils/parser/estree; strict public declaration checking then reports `Cannot find module '@typescript-eslint/utils'`.
3. Pinned `type-fest@5.10.0` is nested under `node_modules/@brandonramsey/lint/node_modules`. Hoisted `eslint-import-context` cannot resolve into that descendant. Its declaration import instead finds the candidate's root `type-fest@0.21.3`, also confirmed by `package-lock.json`. Strict TypeScript 7 checking reports `TS2344` at that version's `ts41/get.d.ts` lines 93–94. A nested bundled dependency therefore does not guarantee the resolver's declarations receive the intended version.

These are first-party installed package declarations/manifests and the candidate lock, not inferred runtime failures. They establish a packaging/declaration dependency defect. Application execution can pass while a separate `skipLibCheck: false` configuration/public API compilation fails. Simply installing utils is not a TypeScript 7-compatible remedy under its assessed compiler peer contract. A package remediation must address the exposed declaration boundary and dependency ownership, then repeat strict consumer declaration verification; no remediation was made as part of this assessment.

## Consumer settings and limits

Read-only inspection of `personal-assistant-project/package.json`, `tsconfig.json`, and its installed TypeScript manifest confirmed TypeScript 7.0.2; ESM; `NodeNext`; strict checking; `noEmit`; `erasableSyntaxOnly`; relative-extension rewriting; and inclusion of `src/**/*.ts` plus `scripts/**/*.ts`. No package installation, compiler change or configuration edit was made in the original consumer during this assessment.

Use the application compiler for application diagnostics and native Oxlint/tsgolint for typed lint rules. [ADR 0018](../../adr/0018-use-native-typed-project-coverage.md) assigns project selection and inferred programs to the native typed engine. Version alignment alone does not prove identical diagnostics, coverage or handling of every compiler option. Existing Node types (`^26.6.4`) describe application APIs independently of the Node 24.21.0 tool runtime; this compiler assessment does not establish that all those APIs exist in Node 24.

Compiler-source research used the browser for official registry metadata and tagged upstream files after direct shell registry access was unavailable to the researcher. The separate consumer experiment subsequently installed public registry dependencies successfully. The report records exact retrieved versions instead of relying on mutable latest-version claims beyond the date above.
