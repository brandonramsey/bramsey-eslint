# Target Node 24 applications by default

Node compatibility checks use a fixed default application baseline of Node 24 or newer. Consumers do not need to provide `engines.node` merely to establish the lint policy's target. This deliberately favors a simple, modern shared baseline over deriving a different target from every consuming project.

The linting tool itself remains compatible with Node `^22.13.0 || >=24.0.0`. The package's `engines.node` describes that tooling requirement; it does not enforce the application's runtime requirement. Applications using the default policy should declare their own Node 24 runtime requirement.
