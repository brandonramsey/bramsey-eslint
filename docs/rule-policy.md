# Explicit rule policy

These semantic policy choices have been approved during the design interview. Implementation must map them to existing rule identifiers and options, validate them against the selected dependencies, and generate the exhaustive settings reference. All enabled rules have error severity.

## Coverage

The current implementation maps this policy to native Oxlint/tsgolint plus bundled Stylistic and the policy plugin. Native naming uses simplified declaration-level `id-match` rather than typescript-eslint's selector-based convention. The provider table below records the original ESLint ownership; see the [current interface](oxlint-configuration.md) for the implemented owners and the [historical reference index](../examples/README.md) for the original settings. Native rule inventory is tracked in #14. ADRs [0017](adr/0017-publish-configuration-and-plugins-without-a-runner.md) and [0018](adr/0018-use-native-typed-project-coverage.md) supersede the original compiler/description obligations below.

| Source | Purpose |
| --- | --- |
| ESLint core | General JavaScript correctness and quality |
| typescript-eslint | TypeScript correctness, typed checks, and TypeScript conventions |
| ESLint Stylistic | Formatting |
| import-x | Import correctness and conventions |
| TypeScript import resolver | Match imports to the project's TypeScript resolution settings |
| Unicorn | Additional quality checks and explicitly chosen conventions |
| eslint-plugin-n | Node correctness and Node 24 API compatibility |
| ESLint comments plugin | Require descriptions for inline rule-disable directives |

Curate individual rules explicitly and give overlapping checks one owner. Parsers, plugins, and resolvers are supplied by this package. SonarJS is outside the first-release set pending compatibility and overlap review.

## Formatting

| Convention | Decision |
| --- | --- |
| Indentation | Two spaces |
| String quotes | Single quotes, with escaping exceptions |
| Semicolons | Required |
| Trailing commas | Required in multiline constructs where legal |
| Control-statement braces | Required for all control statements |
| Arrow-parameter parentheses | Always required |
| Line endings | LF |
| JSX attribute quotes | Double quotes |
| Property quotes | Only when needed |
| Maximum line length | No hard limit |

Other spacing and layout settings use Stylistic's standard recommended/customized baseline with the approved formatting overrides.

## TypeScript

Supported projects use `strict: true`, including effective `strictNullChecks: true`, and `noUncheckedIndexedAccess: true`. Run TypeScript compiler checks separately; typed ESLint rules complement them rather than reproduce all compiler diagnostics. This is the documented compiler baseline, not a claim that the library checks every compiler option automatically.

| Convention | Decision |
| --- | --- |
| Explicit `any` | Banned |
| Non-null assertions | Banned |
| `@ts-ignore` | Banned |
| `@ts-expect-error` | Requires a description |
| Enums | Banned |
| Type-only imports | Required where an import is only used as a type |
| Type declarations | Prefer type aliases over interfaces |
| Exported function return types | Explicit return types required |
| Local function return types | Inference permitted |
| Local value binding names | camelCase |
| Type naming | PascalCase |
| Constants | UPPER_CASE permitted |
| Interface names | No `I` prefix, including when an override permits an interface |
| Object/type property names | Exempt from naming format requirements, preserving external schemas |
| Original destructured keys | Exempt from naming format requirements |
| Renamed destructured local bindings | Follow the local binding naming policy |
| Array types | `T[]` for simple element types; `Array<T>` for complex element types |
| Dictionary types | Prefer `Record` |
| Never-reassigned private members | Require `readonly` |
| Constant class getters | Prefer readonly fields |
| Obvious literal variable types | Infer rather than redundantly annotate |
| Generic constructor arguments | Place type arguments on the constructor |
| Call-signature-only object types | Prefer function-type aliases |
| Optional chaining/nullish coalescing | Prefer where behavior is equivalent |

## Production correctness

| Convention | Decision |
| --- | --- |
| Number/string and nullable-primitive conditions | Require explicit boolean comparisons or checks |
| Nullable-object conditions | Presence checks are permitted |
| Promises | Await, return, or provide rejection handling; `void` alone does not exempt a floating promise |
| Async callbacks assigned to void callback positions | Rejected |
| Promises returned by async functions | Use `return await` |
| Newly thrown values | Must be Error-compatible |
| Direct rethrows | Preserve caught values, including `unknown` |
| Promise rejection callback parameters | Use `unknown` |
| Unnecessary conditions | Enforce with accurate indexed-access types; permit defensive type-predicate assertions |

Type-aware rules apply to the typed TypeScript profiles. JavaScript, explicitly syntax-only TypeScript, and the declaration profile retain applicable syntax checks without pretending to provide typed diagnostics.

Apply the selected policy explicitly rather than relying on upstream rule defaults. See [strict boolean expressions](https://typescript-eslint.io/rules/strict-boolean-expressions/), [floating promises](https://typescript-eslint.io/rules/no-floating-promises/), [misused promises](https://typescript-eslint.io/rules/no-misused-promises/), [return await](https://typescript-eslint.io/rules/return-await/), [thrown errors](https://typescript-eslint.io/rules/only-throw-error/), and [Promise catch parameters](https://typescript-eslint.io/rules/use-unknown-in-catch-callback-variable/).

## Node and CLI operations

Permit synchronous APIs. Require `process.exitCode` instead of `process.exit` by default; an explained inline exception can permit intentional immediate termination.

## Imports and other conventions

| Convention | Decision |
| --- | --- |
| Import organization | Sort groups and imported specifiers |
| Type import form | Separate type-only import declarations |
| Node built-ins | Require `node:` prefixes |
| Source filenames | kebab-case |
| Side-effect imports | Preserve their relative order |
| Import extensions | Follow the project's module-resolution requirements; do not impose a universal extension style |
| Familiar abbreviations | Permit terms such as `props`, `ref`, and `params` |
| `null` | Permitted |

## Other production practices

Use `const` unless a binding is reassigned, and `let` rather than `var`. Require strict equality and explicit conversion for nonstring template interpolation or mixed string/number concatenation. Reject empty functions unless their bodies contain an explanatory comment, static-only classes, and dynamic property deletion. Prefer `for-of` to loops that use an index only to retrieve array elements. Top-level await is optional. Tests retain these practices except the expressly listed test relaxations.

## Deliberately unenforced Unicorn conventions

Keep `forEach` and `reduce` available. Permit nested helper locality, mutating array APIs, and ordinary ternary/switch choices. Do not enforce extra boolean-name prefixes, a fixed catch-variable name, class-member ordering, or TODO expiration. Curate its bug checks and the explicitly approved conventions rather than adopting its entire recommended preset.

## Tests

Automatically apply a built-in relaxed profile to standard `*.test.*`, `*.spec.*`, and `__tests__` patterns. Permit custom patterns for fixtures. Typed test selection uses native Oxlint/tsgolint project or inferred settings unless explicitly designated syntax-only; no custom coverage warning or independent compiler inspection is supplied.

Relax exported return annotations, filename naming, non-null assertions, unsafe type assertions, explicit `any`, and corresponding unsafe-value checks in tests. Keep formatting, import checks, and other typed correctness checks. Numeric structural limits are disabled in the test profile. Exact rule identifiers for the relaxed checks will be documented in the generated reference.

## Severity and exceptions

All enabled rules report errors. Permit narrow consumer configuration overrides and inline disable comments. Descriptions remain recommended but unenforced under ADR 0017; the comments plugin is development-only. Retain configured unused-disable errors and blanket-disable rejection. Consumers own invocation and repeated fixes; no one-pass convergence is promised.

## Structural limits

| Production convention | Decision |
| --- | --- |
| Cyclomatic complexity | Maximum 10 |
| Nesting depth | Maximum 4 |
| Function parameters | Maximum 4 |
| Function/file size | No hard limits |

Disable these numeric limits in the test profile.

## File categories

Support TypeScript and JavaScript files within TypeScript projects, including TSX/JSX syntax without framework-specific checks. Ignore generated output such as `dist`, `build`, and `coverage`, and dependency directories. Consumers identify other generated files explicitly.

## Handwritten declarations

Use a syntax-only declaration profile. Permit interfaces, ambient enums, namespaces, and required global `var` declarations to support declaration merging and describe existing APIs. Keep formatting, import checks, and the explicit `any` ban. Disable runtime-oriented rules and numeric structural limits for this profile.

This is the package's chosen exception policy, not an upstream declaration preset. TypeScript [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) explains why an unconditional interface ban would reject valid augmentation.
