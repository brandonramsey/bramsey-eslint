# Let ESLint own formatting

For the implemented Oxlint configuration, [ADR 0013](0013-use-stylistic-in-the-planned-oxlint-stack.md) retains Stylistic as formatting authority through the JavaScript bridge, and [ADR 0017](0017-publish-configuration-and-plugins-without-a-runner.md) assigns execution and repeated fixing to consumers. The original first-release decision below is historical.

The package will enforce formatting through ESLint alongside its code-quality policy. A separate formatter would introduce another formatting authority and require coordinating overlapping rules. Consumers of the first-release policy should use ESLint's fixes for the formatting covered by this package.
