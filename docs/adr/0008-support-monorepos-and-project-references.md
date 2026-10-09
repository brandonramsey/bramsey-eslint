# Support monorepos and project references from the first release

The workspace support goal remains. The implemented Oxlint model uses native typed selection under [ADR 0018](0018-use-native-typed-project-coverage.md) and separate package-owned import resolution; it does not use consumer TypeScript as tsgolint's compiler. See the [current interface](../oxlint-configuration.md). The original first-release arrangement below is retained as history.

The first release supports single projects and workspace or monorepo layouts with multiple TypeScript configurations, path aliases, and project references. Assuming one root TypeScript configuration would simplify setup but make typed linting and import checks unreliable for the intended project layouts. Configuration must use the consuming project's actual TypeScript and module-resolution settings.
