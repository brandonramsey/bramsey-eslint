# Keep the first release framework-neutral

The first release targets TypeScript projects and the JavaScript files within them, without assuming an application framework. Standalone JavaScript projects are outside the first-release promise: they need a separate compiler-dependency and package-manager contract to preserve the installation requirement. Framework-specific checks can be useful, but including them in the core would make unrelated projects inherit framework requirements. Framework-specific support is outside the first-release scope.

The first release targets Node applications and tooling. Browser support and explicit environment selection are possible later additions, not current requirements; adding them should provide an explicit boundary for runtime-specific rules and globals.
