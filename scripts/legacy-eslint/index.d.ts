import type { ESLint, Linter } from 'eslint';
import type { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export type ConfigOptions = {
  /** Absolute project root; defaults to process.cwd(). */
  projectRoot?: string;
  /** Explicit files outside tsconfig that should receive syntax-only checks. */
  syntaxOnlyFiles?: string[];
  /** Additional patterns for the automatically applied test profile. */
  testFiles?: string[];
  /** Set false to give tests the production policy. Defaults to true. */
  tests?: boolean;
  /** Additional global ignore patterns. */
  ignores?: string[];
  /** Resolver customization, including nonstandard tsconfig filenames. */
  resolverOptions?: NonNullable<Parameters<typeof createTypeScriptImportResolver>[0]>;
  /** Override inferred package mode for files without dedicated extensions. */
  commonjsFiles?: string[];
  moduleFiles?: string[];
};

export declare function createConfig(options?: ConfigOptions): Linter.Config[];
export declare const plugins: Record<string, ESLint.Plugin>;
declare const config: Linter.Config[];
export default config;
