# Document all available rules

The maintained rule reference must list every available ESLint core rule and every rule from the plugins supplied by this package, including disabled rules, with severity and options. A shorter enabled-rule list would hide deliberate exclusions and would not meet the intended transparency requirement.

Generate and commit the reference from resolved configurations, using separate JavaScript and TypeScript profiles and adding profiles when file categories have distinct settings. CI must check for drift. Document the resolved configured settings supplied by this library; expanding all omitted internal option defaults is outside the contract.

ESLint resolves settings for a particular file through its [Node API](https://eslint.org/docs/latest/integrate/nodejs-api), which is why a single undifferentiated settings list would be misleading.

## Oxlint example requirement — October 8, 2026

For the Oxlint migration, the maintainer clarified that the complete generated reference must result in an editable example file that consumers can drop in as their Oxlint rule configuration. Before edits, it must reproduce this package's defaults, including disabled rules, configured options and profile-specific overrides, so adoption changes no effective settings relative to the package's normal default configuration. Here, defaults means the shared package policy, not Oxlint's built-in presets.

The example must load the packaged configuration/plugins through public exports and derive consumer-specific paths at load time; it must not contain research/repository paths or fixture-specific roots. Users can then customize explicit rule entries without assembling plugin dependencies. Preserve effective-settings equivalence, complete inventory and generated-file drift checks; profile snapshots and summaries may support the example but do not replace the usable drop-in artifact. The current ESLint implementation remains unchanged until the migration.
