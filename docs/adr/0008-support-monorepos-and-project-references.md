# Support monorepos and project references from the first release

The first release supports single projects and workspace or monorepo layouts with multiple TypeScript configurations, path aliases, and project references. Assuming one root TypeScript configuration would simplify setup but make typed linting and import checks unreliable for the intended project layouts. Configuration must use the consuming project's actual TypeScript and module-resolution settings.
