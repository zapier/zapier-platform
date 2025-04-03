import type { AST } from 'json-schema-to-typescript/dist/src/types/AST.js';
import type { LevelWithSilent } from 'pino';

export type ZapierSchemaDocument = {
  version: string;
  schemas: RawSchemaLookup;
};

export type RawSchemaLookup = Record<string, any>;

export type NamedAst<N extends AST = AST> = N & { standaloneName: string };

export type NodeMap = Map<string, NamedAst>;

export interface CliOptions {
  /**
   * @default "info"
   */
  logLevel?: LevelWithSilent;

  /**
   * The `exported-schema.json` file from zapier-platform-schema to
   * compile from. Typically the latest built output from
   * zapier-platform-schema.
   *
   * @default "../schema/exported-schema.json"
   */
  schemaJson?: string;

  /**
   * The file to write the generated TypeScript to.
   *
   * @default "../core/types/schemas.generated.d.ts"
   */
  output?: string;

  /**
   * If to skip augmenting the `Function` type with an actual function
   * signature, because raw JSON schema cannot provide the code-level
   * function details. If true, output is much closer to a raw 1-1
   * interface for each schema.
   *
   * @default false
   */
  skipPatchPerformFunction?: boolean;

  /**
   * What import to use for import `ZObject` and `Bundle` from. Defaults
   * to its sibling custom types module in platform-core, but can be
   * overridden to `zapier-platform-core` for example.
   *
   * @default "./custom"
   */
  platformCoreCustomImport: string;
}

export interface CompilerOptions extends CliOptions {
  /** The version of this schema-to-ts compiler */
  compilerVersion: string;

  /** The zapier-platform version of schemas that are being compiled. */
  platformVersion: string;
}
