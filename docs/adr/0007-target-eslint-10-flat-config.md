# Target ESLint 10 flat config

The first release supports ESLint 10 using flat configuration and ESLint 10's supported Node runtimes. Supporting older ESLint releases or legacy configuration would expand the compatibility and documentation burden without serving the chosen first-release target. ESLint's supported Node range at this decision is `^20.19.0 || ^22.13.0 || >=24.0.0`.

The package's linting runtime range is `^22.13.0 || >=24.0.0`, allowing current Unicorn quality and convention rules while dropping ESLint's Node 20 tooling support. This is separate from the consuming application's target Node version. Selected dependencies must remain compatible with this promise.

Requirements were checked on October 7, 2026 against the [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0) and [Unicorn v76 dependency manifest](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v76.0.0/package.json).
