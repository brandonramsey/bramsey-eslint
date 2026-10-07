# Shared ESLint package design

Status: design confirmed and implemented locally. Public npm publication awaits account authentication and trusted-publisher setup.

## Goal

Publish an npm package supplying a common policy for TypeScript projects: formatting, code quality, TypeScript checks, and other explicitly chosen conventions. Consumers install the package and ESLint without separately installing any parsers, plugins, or extended rulesets. Maintain an exhaustive example showing each available rule and the package's settings.

## Settled decisions

1. [Framework-neutral TypeScript projects, including their JavaScript files](adr/0001-framework-neutral-first-release.md). Standalone JavaScript projects are outside the first-release promise.
2. [Maximum strictness and extensive conventions, chosen explicitly](adr/0002-explicit-strict-and-opinionated-policy.md).
3. [ESLint owns formatting](adr/0003-eslint-owns-formatting.md).
4. [Generate an exhaustive reference from resolved profiles and check it for drift](adr/0004-exhaustive-rule-reference.md). Include disabled rules and configured options; do not expand all omitted internal option defaults.
5. [Package all lint extensions; use the consuming TypeScript project's compiler](adr/0005-package-lint-dependencies.md).
6. [Enable typed TypeScript checks by default, with explicit syntax-only file patterns](adr/0006-enable-typed-checks-by-default.md).
7. [Target ESLint 10 flat config and Node `^22.13.0 || >=24.0.0` for linting](adr/0007-target-eslint-10-flat-config.md). The application's Node target is a separate contract.
8. [Target Node applications and tooling first](adr/0001-framework-neutral-first-release.md). Browser support and explicit environment selection may be added later.
9. [Concrete formatting, TypeScript, import, and filename conventions](rule-policy.md) are approved.
10. [Support single projects and monorepos with aliases and project references](adr/0008-support-monorepos-and-project-references.md).
11. [Export an ESM default config array and named `createConfig` factory](adr/0009-export-default-config-and-factory-as-esm.md), with examples in `eslint.config.mjs`.
12. [Use Node 24+ as the default application target](adr/0010-default-application-target-node-24.md), independent of the linting tool's Node runtime.
13. [Rule coverage](rule-policy.md): ESLint core, typescript-eslint, Stylistic, import-x and its TypeScript resolver, Unicorn, and eslint-plugin-n, with explicit curation.
14. [Enforce naming for bindings and types while exempting property names and original destructured keys](rule-policy.md).
15. [Automatically apply a relaxed profile to standard test patterns](rule-policy.md), with configurable fixture patterns. Permit `any` and unsafe fixture operations; retain formatting, import checks, and other typed correctness checks.
16. [Support both ESM and CommonJS consuming applications](adr/0009-export-default-config-and-factory-as-esm.md), while publishing the config package as ESM.
17. [All enabled rules are errors; allow described inline exceptions and report unused disables as errors](rule-policy.md).
18. [Production limits: complexity 10, nesting 4, parameters 4; no hard function/file size limits](rule-policy.md). Relax these limits in tests.
19. [Support JSX syntax and a syntax-only handwritten-declaration profile, and exclude generated output](rule-policy.md). Declaration exceptions permit interfaces, ambient enums, namespaces, and required global `var` declarations, while retaining the `any` ban.
20. Publish under the intended name `@brandonramsey/eslint`; verify availability and publishing access before release.
21. Retain the ISC license and include the matching license file in the package.
22. Use a public GitHub source repository named `bramsey-eslint`.
23. [Release `0.1.0` first, validate before `1.0.0`, and treat stricter stable defaults as major changes](adr/0011-stabilize-the-policy-before-one-point-zero.md).
24. [Supported projects use TypeScript's strict compiler baseline plus `noUncheckedIndexedAccess`, and run compiler diagnostics separately](rule-policy.md).
25. [Explicit production correctness policy](rule-policy.md): primitive truthiness checks, handled promises, safe async callback positions, `return await`, Error-compatible new throws, preserved direct rethrows, and unknown Promise rejection values.
26. [Permit synchronous CLI APIs; prefer exit codes over immediate process termination with explained exceptions](rule-policy.md).
27. [Validate in GitHub Actions and publish explicit version tags through npm trusted publishing](adr/0012-validate-and-publish-through-github-actions.md).
28. [Enable unnecessary-condition checks with accurate indexed types while permitting defensive type-predicate assertions](rule-policy.md).
29. [Remaining TypeScript notation, readonly, and inference conventions are explicitly approved](rule-policy.md).
30. [Leave the declined optional Unicorn conventions unenforced](rule-policy.md): iteration methods, helper locality, array mutation, conditional shape, extra naming, member order, and TODO deadlines.
31. [Remaining production practices are explicitly approved](rule-policy.md): const/let, strict equality, explicit coercion, nonempty functions, class shape, dynamic deletion, and index-only loops.

## Current interview frontier

The complete design was confirmed for implementation. No interview decisions remain pending.

## Remaining branches

- Push the verified source to the public GitHub repository and verify CI.
- Authenticate npm, configure trusted publishing, and verify the first public release.

The [exhaustive generated references](../examples/README.md) resolve the executable configuration and list every available core and shipped-plugin rule. The package exports its default array and createConfig factory, with representative behavior tests and packed-consumer validation.

## Known constraints

TypeScript project service does not automatically fall back to syntax-only checking for files outside a project. Exception selection must be explicit in the design.

A TypeScript peer dependency preserves compiler consistency. Missing-peer installation differs across package managers, so standalone JavaScript support needs an explicit dependency contract.

The intended public name is `@brandonramsey/eslint`, and ISC is the chosen license. Registry lookup returned 404; scope ownership remains unverified because this machine is not authenticated to npm. The public GitHub repository is [brandonramsey/bramsey-eslint](https://github.com/brandonramsey/bramsey-eslint). Supported compiler versions are TypeScript 5.9–6.0; the tested lint range starts at ESLint 10.4.
