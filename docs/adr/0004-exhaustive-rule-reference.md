# Document all available rules

The maintained rule reference must list every available ESLint core rule and every rule from the plugins supplied by this package, including disabled rules, with severity and options. A shorter enabled-rule list would hide deliberate exclusions and would not meet the intended transparency requirement.

Generate and commit the reference from resolved configurations, using separate JavaScript and TypeScript profiles and adding profiles when file categories have distinct settings. CI must check for drift. Document the resolved configured settings supplied by this library; expanding all omitted internal option defaults is outside the contract.

ESLint resolves settings for a particular file through its [Node API](https://eslint.org/docs/latest/integrate/nodejs-api), which is why a single undifferentiated settings list would be misleading.
