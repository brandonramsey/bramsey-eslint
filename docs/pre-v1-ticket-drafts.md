# Approved pre-v1 ticket plan

The maintainer approved this seven-ticket plan on October 8, 2026. All seven issues have been submitted to the current GitHub repository, with verified bodies, triage labels, and 16 native blocking relationships. The approved direction is Oxlint + oxlint-tsgolint + @stylistic/eslint-plugin, native id-match for simplified naming, and no Oxfmt. Target identities: GitHub `brandonramsey/lint` and npm `@brandonramsey/lint`. The executable package and external identities have not yet changed.

The plan covers actual engine migration, all maintained code in TypeScript, the identity transition, CI/CD, and isolated consumer assessment. Convention simplifications do not authorize silently dropping correctness checks. Unresolved implementation/release-blocking gaps discovered during validation must become explicit dependencies.

## Summary

Scope update, October 8, 2026: the maintainer withdrew issue #11's custom inferred-coverage warning and independent compiler inspection. [ADR 0018](adr/0018-use-native-typed-project-coverage.md) accepts native Oxlint/tsgolint coverage and diagnostics, retaining typed rules and declaration/syntax-only exemptions. Issue #11 is no longer planned, and #12 now depends only on #10. Earlier coverage-warning requirements below are historical.

During decomposition of issues #2 and #3 on October 8, 2026, the maintainer limited the package to configuration and bundled plugins, with Oxlint as a peer dependency, accepted unenforced disable-comment explanations as a configuration-only limitation, and narrowed tests to the public package surface. [ADR 0017](adr/0017-publish-configuration-and-plugins-without-a-runner.md) supersedes runner, independent preflight, repeated-fix and consumer-harness obligations in the historical drafts and handoff. The maintainer approved the revised seven-child breakdown, published as issues #8–#14 with verified bodies, labels, parent links and seven native blocking relationships. The parent bodies/states and original drafts below have not been rewritten.

During issue #1 validation on October 8, 2026, the maintainer approved warning and continuing for inferred TypeScript coverage rather than a hard setup error. [ADR 0015](adr/0015-warn-for-inferred-typescript-coverage.md) records that revision, and issue #1's live acceptance criterion has been updated. The original approved drafts below retain their historical wording.

The maintainer also approved native parsing with package-aware globals and policy selection, recorded in [ADR 0016](adr/0016-use-native-parsing-with-package-aware-policy.md). Issue #1's configuration research and concrete [implementation proposal](research/oxlint-candidate/public-interface.md) are complete; production implementation and packed-package verification remain issue #2 work.

| Issue | Ticket | Blocked by | Triage |
| --- | --- | --- | --- |
| [#1](https://github.com/brandonramsey/bramsey-eslint/issues/1) | Validate the Oxlint core policy with tsgolint, Stylistic, and simplified naming | None | ready-for-agent |
| [#2](https://github.com/brandonramsey/bramsey-eslint/issues/2) | Implement the Oxlint package in TypeScript and ship its public configuration | 1 | ready-for-agent |
| [#3](https://github.com/brandonramsey/bramsey-eslint/issues/3) | Convert maintained tooling and tests to TypeScript for the Oxlint package | 2 | ready-for-agent |
| [#4](https://github.com/brandonramsey/bramsey-eslint/issues/4) | Rename the GitHub project and npm package to lint | 2, 3 | ready-for-human |
| [#5](https://github.com/brandonramsey/bramsey-eslint/issues/5) | Gate npm publishing on the full compatibility matrix for the tagged commit | 2, 3, 4 | ready-for-agent |
| [#6](https://github.com/brandonramsey/bramsey-eslint/issues/6) | Assess the migrated pre-v1 core policy against personal-assistant-project | 2, 3, 4 | ready-for-agent |
| [#7](https://github.com/brandonramsey/bramsey-eslint/issues/7) | Complete the v1 readiness review and record the release decision | 1, 2, 3, 4, 5, 6 | ready-for-human |

## Draft 1: Validate the Oxlint core policy with tsgolint, Stylistic, and simplified naming

The drafts below retain the original seven-ticket plan. The proposed child breakdown following the configuration-only decision is recorded at the end of this document.

Proposed triage: `ready-for-agent`.

## What to build

Establish an executable candidate using native Oxlint rules, oxlint-tsgolint for typed correctness, and @stylistic/eslint-plugin through the JavaScript plugin API. Resolve policy and integration gaps before implementing the public package, using the existing coverage audit as evidence rather than treating rule-name matches as behavioral parity.

## Acceptance criteria

- [ ] Run the candidate across all current reference profiles, including JavaScript, TypeScript, JSX/TSX, declarations, CommonJS, and tests. Include no Oxfmt, formatter adapter, dedicated naming plugin, or Vite+ requirement.
- [ ] Port all 66 configured Stylistic rules and settings; verify representative diagnostics, fixes, and repeated-fix stability. Record bridge defects and accepted limitations. The bounded quotes/semicolon probe required two fix invocations; loading all rules is insufficient evidence.
- [ ] Replace selector-based naming with native id-match using a shared pattern permitting camelCase, PascalCase, UPPER_CASE, and a leading underscore. Drop role-specific casing and the interface I-prefix restriction.
- [ ] Select naming scope with paired fixtures. Preserve external-schema usability and document accepted differences for parameters, types, imports, members, and destructured aliases. Start with declaration-focused checks; broader checks rejected TypeScript property signatures despite properties=false in the audit.
- [ ] Review convention-only custom options individually and record simplifications. Preserve promise safety and unsafe-value checks; propose explicit resolutions for import resolution/order, Node runtime checks, enum restrictions, comment descriptions, and non-strict CommonJS gaps. Do not silently discard checks to increase native coverage.
- [ ] Review enabled nursery rules, defaults, options, diagnostic scope, and fixes. Validate the current typed checks using tsgolint rather than loading typed ESLint rules through the JavaScript bridge.
- [ ] Verify visible setup errors for unexpectedly out-of-project TypeScript, explicit syntax-only patterns, monorepos/project references, path aliases, required declaration builds, ESM/CommonJS selection, and consumer overrides. Any inability to preserve these contracts requires a maintainer decision before implementation.
- [ ] Select the highest stable TypeScript supported by the complete candidate stack using published compatibility evidence and execution tests. Record tsgolint/compiler coupling and alert when one dependency family alone blocks upgrading. Do not carry forward the old typescript-eslint ceiling as an assumption.
- [ ] Compare complete lint runs, including Stylistic, with the current engine on the same representative snapshot; record environment and timings without extrapolating upstream benchmarks.
- [ ] Deliver a resolved rule mapping, accepted convention changes, remaining defects, and a concrete Oxlint-native public configuration proposal for draft 2. Track unresolved release-blocking gaps explicitly.

## Blocked by

None.

## Draft 2: Implement the Oxlint package in TypeScript and ship its public configuration

Proposed triage: `ready-for-agent`.

## What to build

Replace the package's ESLint engine and flat-config interface with the validated Oxlint core policy. Develop maintained implementation in strict TypeScript and ship executable ESM plus generated declarations and the configuration/plugin assets needed by consumers.

## Acceptance criteria

- [ ] Implement the configuration interface resolved in draft 1, including project roots, intentional syntax-only patterns, overrides, and monorepo/reference behavior. Document installation and invocation through a real Oxlint consumer example.
- [ ] Integrate oxlint-tsgolint and Stylistic into one quality-and-style lint command with the tested native naming policy. Resolve each correctness gap or obtain an explicit maintainer decision; do not introduce an implicit ESLint fallback or Oxfmt.
- [ ] Convert all maintained package implementation to strict TypeScript. Generate runtime ESM and public declarations; preserve intentional JavaScript/CommonJS/declaration fixtures and generated consumer-format examples.
- [ ] Remove superseded ESLint runtime/parser/resolver dependencies where no longer required. Retain actual third-party names and dependencies required by the chosen bridge rules.
- [ ] Establish supported Node, Oxlint, tsgolint, and TypeScript boundaries from evidence. Replace obsolete ESLint peer requirements and validate the newest mutually supported stable compiler, reporting any single upgrade-blocking family.
- [ ] Verify public exports, native configuration shape and required settings, consumer type checking, and packaged plugin asset resolution from the actual packed artifact after a clean build. Use one minimal consumer smoke check for integration; assume Oxlint rules work. Test package-owned composition, coverage and runner behavior directly. Consumers must not rely on unpublished source files or repository-only dependencies.
- [ ] Update generated rule references, examples, glossary wording, and current design/interface documentation for the implemented engine. Preserve historical ADRs and identify their superseding decisions.

## Blocked by

Draft ticket 1.

## Draft 3: Convert maintained tooling and tests to TypeScript for the Oxlint package

Proposed triage: `ready-for-agent`.

## What to build

Use TypeScript for maintained development scripts, tests, and executable repository configuration, and adapt reference/packed-consumer tooling to Oxlint. Keep tests as simple as possible, focused on the public exports and package-owned functionality. Assume Oxlint works; do not reproduce its rule tests. Keep documented development commands usable from a clean checkout.

## Acceptance criteria

- [ ] Convert maintained scripts, tests, and executable configuration to TypeScript and include them in strict type checking. Declarative JSON/YAML configuration and intentional format fixtures remain in their appropriate formats.
- [ ] Establish a clean-checkout execution path on supported Node runtimes without a circular build/configuration dependency. If Oxlint consumes serialized configuration, generate it from maintained TypeScript and check drift.
- [ ] Replace ESLint-specific tests with direct public-export and configuration-contract assertions: required settings, plugin exports/assets, option composition, profile exemptions and consumer precedence. Test package-owned coverage/resolution/preflight/runner logic only where necessary to protect functionality. Use a small packed-consumer smoke check; do not migrate the research probes into per-rule Oxlint tests.
- [ ] Preserve exhaustive generated rule references and drift detection, adapting inventory and resolution to native and bridged rules.
- [ ] Verify complete development checks, clean builds, and packed-consumer commands. Preserve intentional ESM/CommonJS/declaration fixtures and generated examples.

## Blocked by

Draft ticket 2.

## Draft 4: Rename the GitHub project and npm package to lint

Proposed triage: `ready-for-human`.

## What to build

Change GitHub brandonramsey/bramsey-eslint to brandonramsey/lint and npm @brandonramsey/eslint to @brandonramsey/lint. Align current branding, consumer setup, and publishing metadata with the migrated engine. Account administration and publisher configuration need maintainer participation; an agent can prepare repository edits.

## Acceptance criteria

- [ ] Verify ownership, permissions, and target-name availability before the external cutover. Rename the existing GitHub repository, preserving history and issue relationships, and update the local remote and tracker guidance to the verified new location.
- [ ] Update package/lockfile identity, description, repository/bugs/homepage metadata, README headings and installation/import examples, consumer harness package names, temporary-directory prefixes, generated references, and active project branding.
- [ ] Audit remaining ESLint mentions. Remove obsolete project branding and current engine instructions; preserve accurate historical release evidence, upstream rule namespaces, and literal third-party names such as @stylistic/eslint-plugin.
- [ ] Treat @brandonramsey/lint as a new npm package identity. Record its first-release version, public access, and required bootstrap/account steps. This ticket does not authorize deleting or unpublishing historical @brandonramsey/eslint releases.
- [ ] Configure or verify trusted publishing for @brandonramsey/lint against brandonramsey/lint, the final workflow filename, and any configured environment. Update provenance metadata and release instructions; do not assume the old publisher binding transfers.
- [ ] Verify the packed artifact and clean consumer examples use the intended new identity. Check GitHub redirects and current links after the rename.
- [ ] Prepare account-only steps for maintainer execution where tooling cannot perform them. Package publication remains subject to draft 5's same-tag CI gate and a separate explicit release action.

## Blocked by

Draft tickets 2, 3.

## Draft 5: Gate npm publishing on the full compatibility matrix for the tagged commit

Proposed triage: `ready-for-agent`.

## What to build

Update existing GitHub Actions for the TypeScript/Oxlint build and require full supported-matrix validation of the exact tagged commit before publishing @brandonramsey/lint from brandonramsey/lint.

## Acceptance criteria

- [ ] CI performs clean builds, strict type checking, combined Oxlint/tsgolint/Stylistic linting, minimal package-contract tests, generated-reference drift checks, and packed-consumer validation.
- [ ] Replace the obsolete ESLint matrix with supported runtime and Oxlint/tsgolint/compiler boundary combinations established in draft 2. Respect tsgolint/compiler coupling rather than constructing unsupported cross-products.
- [ ] Include the highest mutually supported stable TypeScript and report any single dependency family blocking an upgrade. Distinguish published support from demonstrated compatibility.
- [ ] Publishing depends on successful full-matrix validation of the same tagged commit; any matrix failure prevents publication. Do not reuse an unrelated branch run as release evidence.
- [ ] Require explicit version-tag/package-version matching, public scoped-package access, trusted publishing bound to the renamed identities, and provenance. Ordinary branch pushes do not publish.
- [ ] Verify success and failure gates with a reviewable method, including a failed matrix job and a mismatched version tag, without publishing a test release solely to exercise the gate.
- [ ] Update release instructions and any first-publication bootstrap. Distinguish historical v0.1.0 under the old name from first publication under the new identity.

## Blocked by

Draft tickets 2, 3, 4.

## Draft 6: Assess the migrated pre-v1 core policy against personal-assistant-project

Proposed triage: `ready-for-agent`.

## What to build

Produce an isolated compatibility report for adopting the migrated pre-v1 core policy in personal-assistant-project, plus follow-up ticket drafts. Include relevant current work without altering the original working tree or permanently installing/configuring linting there.

## Acceptance criteria

- [ ] Record the consumer snapshot, candidate package version, runtime/compiler/tool versions, file coverage, and effective reference profiles. Include active work in an isolated snapshot and verify the original working tree is unchanged.
- [ ] Install the actual packed @brandonramsey/lint candidate with public dependencies. Inspect TypeScript implementation, ESM JavaScript tests, and tooling configuration.
- [ ] Use the highest stable TypeScript supported by the complete Oxlint/tsgolint/Stylistic stack. Reassess the consumer's existing TypeScript 7 configuration rather than assuming the old typescript-eslint mismatch still applies; alert if one family alone blocks upgrading.
- [ ] Record required compiler-baseline changes, including the policy's noUncheckedIndexedAccess expectation, and assess them only in isolated copies. Separate existing compiler/test baselines from effects of these adjustments.
- [ ] Run the complete lint command without autofix, plus compiler and existing test baselines where executable. Record unavailable evidence and unrelated pre-existing failures.
- [ ] Separate package/configuration defects from consumer policy violations, prioritize findings, and draft focused follow-up tickets for user review before GitHub submission.
- [ ] Preserve the consumer's user-led implementation boundary. Permanent adoption and source/test remediation require subsequent work.

## Blocked by

Draft tickets 2, 3, 4.

## Draft 7: Complete the v1 readiness review and record the release decision

Proposed triage: `ready-for-human`.

## What to build

Provide evidence and an explicit maintainer decision to freeze the stable core policy and proceed toward v1 under the new project identities.

## Acceptance criteria

- [ ] Repeat isolated consumer validation if the final built release candidate differs from the assessed candidate; record the exact artifact and consumer snapshot.
- [ ] Complete migration and same-tag workflow validation; review final package contents, public configuration, generated references, and renamed metadata.
- [ ] Resolve or explicitly defer every assessed finding. Track each accepted release-blocking defect as a dependency; document bridge/fix limitations and accepted convention reductions.
- [ ] Reconcile current design/release claims with historical v0.1.0 publication and the new identity's release history. Verify current GitHub/npm links and publisher configuration.
- [ ] Record compiler baseline, any single upgrade-blocking family, consumer exceptions, supported profiles, and remaining typed-coverage limitations.
- [ ] The maintainer records the v1 go/no-go decision and stable policy boundary. Publication follows the approved explicit-tag process rather than occurring automatically as part of this review.

## Blocked by

Draft tickets 1, 2, 3, 4, 5, 6.

## Identity transition sources

- [GitHub repository rename behavior and updating local remotes](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).
- [npm package identity and metadata](https://docs.npmjs.com/cli/configuring-npm/package-json/).
- [npm trusted publisher configuration](https://docs.npmjs.com/trusted-publishers/).

## Approved children of #2 and #3

Status: approved and published on October 8, 2026. Section numbers below identify plan items; the table maps them to GitHub issues. All seven bodies, `ready-for-agent` labels, parent links and native blocking relationships were verified. Issue #1 is complete. ADR 0017 governs these tickets where the historical parent handoff mentions runner, preflight or consumer execution tests. The five #2 children cover the public package; the two #3 children finish maintained repository tooling. Parent bodies, titles and states remain unchanged. Permanent tests cover only public exports/declarations, settings, composition, plugin exports/specifiers, packaged metadata/assets and generated-example equivalence/drift; assume Oxlint and upstream plugins work. The dedicated consumer-harness ticket has been removed.

| Plan item | GitHub issue | Parent | Blocked by |
| --- | --- | --- | --- |
| 1 | [#8: Ship the typed Oxlint configuration and packaged plugins](https://github.com/brandonramsey/bramsey-eslint/issues/8) | #2 | None |
| 2 | [#9: Preserve workspace import resolution and compatibility policy](https://github.com/brandonramsey/bramsey-eslint/issues/9) | #2 | #8 |
| 3 | [#10: Detect conflicting re-exports safely](https://github.com/brandonramsey/bramsey-eslint/issues/10) | #2 | #9 |
| 4 (withdrawn) | [#11: Warn when typed linting uses inferred compiler settings](https://github.com/brandonramsey/bramsey-eslint/issues/11) | #2 | No longer planned |
| 5 | [#12: Verify public package contents and document support](https://github.com/brandonramsey/bramsey-eslint/issues/12) | #2 | #10 |
| 6 | [#13: Run repository configuration and contract tests in TypeScript](https://github.com/brandonramsey/bramsey-eslint/issues/13) | #3 | #2 |
| 7 | [#14: Generate an editable Oxlint configuration example matching package defaults](https://github.com/brandonramsey/bramsey-eslint/issues/14) | #3 | #13 |

### 1. Ship the typed Oxlint configuration and packaged plugins

**Parent:** #2. **Blocked by:** None (can start immediately).

**What to build:** Consumers import a native Oxlint default configuration or `createConfig`, with packaged Stylistic support and explicit native policy, and run their own peer-installed Oxlint.

- [ ] Author maintained package implementation in strict TypeScript; generate executable ESM and public declarations, including native configuration and option types.
- [ ] Declare Oxlint as a peer dependency and bundle oxlint-tsgolint and required plugin/provider packages. Establish an initial build and verify compiled plugin specifiers resolve from the package.
- [ ] Preserve required native settings, typed rules, all 66 style settings, simplified naming, generated exclusions, test/declaration/syntax-only profiles, package-aware globals and final consumer override precedence. Explicitly retain the accepted no-inner-declarations option.
- [ ] Canonicalize package-controlled roots and paths; honor dedicated extensions and explicit policy patterns without promising parser-mode switches. Reject unsupported configuration shapes.
- [ ] Verify exports, assets and composition directly. Export no lint executable or execution helper; descriptions are an accepted unenforced limitation, while unused-directive errors and blanket-disable rejection remain configured.

### 2. Preserve workspace import resolution and compatibility policy

**Parent:** #2. **Blocked by:** #8.

**What to build:** Consumers receive project-aware import checks and the retained compatibility checks through bundled plugins in ordinary Oxlint execution.

- [ ] Discover conventional and custom resolver projects, select the nearest project per file, and preserve consumer resolver settings with a no-alias fallback. Explicit project patterns matching nothing fail visibly.
- [ ] Handle independent roots, canonical/symlink inputs, conflicting workspace aliases and required declaration outputs without cross-project cache leakage.
- [ ] Package the selected non-export import, Node runtime/deprecation/exit, polyfill, enum and CommonJS compatibility rules, preserving bridge context prototypes and services.
- [ ] Verify the public configuration passes the intended resolver options/settings and exports the required plugin rules. Keep import resolver selection separate from typed-project membership; add no internal resolution or upstream diagnostic fixture suite.

### 3. Detect conflicting re-exports safely

**Parent:** #2. **Blocked by:** #9.

**What to build:** The bundled policy plugin detects conflicting star-export names and safely handles cyclic or invalid export graphs through the selected project resolver.

- [ ] Publish the scoped child-parser and guarded graph adaptation in strict TypeScript, preserving local export listeners and supporting TypeScript child extensions.
- [ ] Preserve explicit-export precedence, repeated binding identity, namespace and type-only handling; cycles terminate and inspection/depth failures produce actionable diagnostics.
- [ ] Verify the packaged plugin exports the intended rule and the public configuration enables it with required settings. Preserve research evidence separately; add no permanent graph or upstream diagnostic fixture suite.

### 4. Warn when typed linting uses inferred compiler settings

**Status:** Withdrawn under ADR 0018. Accept native Oxlint behavior; do not implement the original draft below.

**Parent:** #2. **Blocked by:** #8.

**What to build:** A bundled warning rule identifies non-exempt TypeScript receiving inferred coverage during consumer-owned Oxlint execution while typed safety checks remain enabled.

- [ ] Validate project configuration before expanding metadata; discover inherited inputs, references including nonstandard filenames, and nearest/reference/ancestor selection consistent with the pinned typed engine.
- [ ] Distinguish configured root membership from transitive program inclusion and from import resolver projects. Malformed configuration fails rather than becoming an inferred warning.
- [ ] Scope caches by canonical root and lint lifecycle and refresh after relevant changes without a package runner. Existing research evidence supplies the implementation rationale; add no compiler-program or internal lifecycle test suite.
- [ ] Configure warnings and declaration/syntax-only exemptions; leave warning-failure flags and overrides to consumers. Assert plugin exports and public warning/exemption settings directly, without testing typed-engine diagnostics.

### 5. Verify public package contents and document support

**Parent:** #2. **Blocked by:** #10 (#10 already requires #9).

**What to build:** The published package exposes its promised configuration, types and plugin assets with the correct core peer and bundled dependencies, and documents how consumers use it.

- [ ] Check clean builds, built public imports/declarations, packed export targets/assets, plugin specifiers and dependency metadata directly. Remove the consumer execution harness; do not install a temporary consumer or invoke Oxlint as a test.
- [ ] Establish supported Node, Oxlint, tsgolint and TypeScript boundaries from published compatibility and existing research evidence; typecheck the public API with the newest mutually supported stable compiler and report any single upgrade-blocking family. Keep consumer TypeScript and tsgolint's embedded compiler contracts distinct; add no lint-engine compatibility fixture suite.
- [ ] Remove obsolete dependencies while retaining required bridge providers; verify or replace unstable provider entry points. Plugins must not require separate consumer installation.
- [ ] Update current reference outputs, consumer examples, glossary/design/interface documentation and supersession links. Document consumer-owned invocation and path alignment, native parser limits, unenforced descriptions and observed multi-pass fixes.
- [ ] Preserve historical ADRs, research evidence and intentional format fixtures. Identity cutover and release workflows remain separate existing tickets.

### 6. Run repository configuration and contract tests in TypeScript

**Parent:** #3. **Blocked by:** Existing issue #2.

**What to build:** Developers run strictly checked TypeScript configuration and package-contract tests from a clean checkout without a circular build dependency.

- [ ] Convert maintained executable repository configuration and tests to TypeScript; include them in strict checking and provide a supported clean-checkout bootstrap/execution path.
- [ ] Replace legacy ESLint-specific per-rule tests with direct public-export/declaration, required-setting, metadata/asset and composition assertions. Remove the consumer execution harness; add no discovery/resolution/graph/lifecycle, runner, preflight or upstream behavior suites.
- [ ] Preserve intentional JavaScript/CommonJS/declaration fixtures and declarative JSON/YAML. Historical research probes remain migration evidence, not maintained production tooling or ordinary tests.
- [ ] Verify clean build, repository self-lint, typecheck and public-contract test commands; include all maintained tooling in strict checking. The reference command is completed in the generated-example ticket (#14). Check generated executable configuration for drift if serialization is required, and update development instructions to remove the consumer-harness command. GitHub Actions and publishing changes remain existing issue #5's responsibility.

### 7. Generate an editable Oxlint configuration example matching package defaults

**Parent:** #3. **Blocked by:** #13.

**What to build:** Consumers can drop in a generated, complete Oxlint configuration example and tweak explicit rule settings. Before edits, the example reproduces the package's defaults and changes no effective policy. Developers generate and verify it using strictly checked TypeScript tooling.

- [ ] Convert the reference generator to TypeScript and adapt inventory/resolution to native owners and packaged bridge exports.
- [ ] Include disabled rules, configured severity/options and all reference profiles; retain declaration/test/syntax-only distinctions without expanding omitted internal defaults.
- [ ] Generate a usable editable example file, not only inventory snapshots. Use public package exports and consumer-derived paths, preserving bundled-plugin loading and profile overrides without repository/fixture-specific roots.
- [ ] Verify the unedited example's effective rules, options and profile settings match the normal package configuration. Document how users change explicit entries while retaining default plugin setup.
- [ ] Produce deterministic committed outputs and a drift command that fails for stale inventory, settings or summary. Document native typed-project coverage and accepted unenforced descriptions.
- [ ] Preserve generated consumer-format examples in their appropriate formats; avoid executing a per-rule probe suite to generate references.
- [ ] Verify the complete documented development check after conversion, including generation drift, using only the public-surface test scope in ADR 0017.
