import type {
  InterfaceDeclaration,
  InterfaceDeclarationStructure,
  PropertySignatureStructure,
  SourceFile,
  TypeAliasDeclarationStructure,
} from 'ts-morph';

import type { JSONSchema4 } from 'json-schema';
import type { LevelWithSilent } from 'pino';
import type Statistics from './statistics.ts';

export type ZapierSchemaDocument = {
  version: string;
  schemas: Record<SchemaPath, TopLevelSchema>;
};

export interface CliOptions {
  /**
   * @default "info"
   */
  logLevel?: LevelWithSilent;

  /**
   * Path to the `exported-schema.json` file from zapier-platform-schema
   * to compile from. Typically the latest built output from
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
   * Whether to ignore unused type overrides.
   *
   * @default false
   */
  ignoreUnusedOverrides?: boolean;
}

export interface CompilerOptions extends CliOptions {
  /** The version of this schema-to-ts compiler */
  compilerVersion: string;
}

export interface VersionInfo {
  /** The version of this schema-to-ts compiler */
  compilerVersion: string;

  /** The zapier-platform version of schemas that are being compiled. */
  platformVersion: string;
}

/** The ID of a schema in the exported-schema.json. */
export type SchemaPath = `/${string}Schema`; // e.g. /AppSchema

/** All schemas in the exported-schema.json have an ID. */
export type TopLevelSchema = JSONSchema4 & { id: SchemaPath };

export type CompilerContext = {
  file: SourceFile;
  schemas: Record<string, TopLevelSchema>;

  /**
   * Queue of schema names that need to be rendered. Added as
   * encountered traversing the schema tree.
   */
  schemasToRender: SchemaPath[];

  /**
   * Schemas that have already been rendered.
   */
  renderedSchemas: Set<SchemaPath>;

  /**
   * Whether to ignore unused type overrides.
   */
  ignoreUnusedOverrides?: boolean;

  stats: Statistics;
};

export type AddTypeContext = {
  compilerCtx: CompilerContext;
  file: SourceFile;
  typeName: string;
  schemaPath: SchemaPath;
  schema: JSONSchema4;
};

export type TypeOverrideFunction = (ctx: AddTypeContext) => void;

/**
 * Overrides can be partial options to the `addTypeAlias` function, or a
 * function that can add, modify, or ignore the type from scratch.
 */
export type TypeOverrides =
  | TypeOverrideFunction
  | typeof IGNORE
  | typeof IGNORE_BUT_FOLLOW_REFS
  | Partial<TypeAliasDeclarationStructure>;

export type TypeOverrideMap = Record<SchemaPath, TypeOverrides>;

export type InterfaceOverridesMap = Record<SchemaPath, InterfaceOverrides>;

export type AddPropertyContext = {
  compilerCtx: CompilerContext;
  iface: InterfaceDeclaration;
  schemaPath: SchemaPath;
  key: string;
  value: JSONSchema4;
  isRequired: boolean;
};

export type PropertyOverrides =
  | string
  | Partial<PropertySignatureStructure>
  | typeof IGNORE
  | typeof IGNORE_BUT_FOLLOW_REFS
  | ((ctx: AddPropertyContext) => void);

/**
 * Specify overrides for an interface and itself properties.
 */
export type InterfaceOverrides = {
  /**
   * Overrides for the interface declaration itself. Will be merged with
   * the default interface declaration.
   */
  self?: Partial<InterfaceDeclarationStructure>;

  /**
   * Collection of optional overrides for properties of the interface.
   * Each value can be one of three things:
   * - A string, which will be used as the type of the property.
   * - An object, which will be merged with the default property declaration.
   * - A function, that can fully add, modify, or ignore the property entirely.
   */
  properties?: Record<string, PropertyOverrides>;
};

/**
 * Special symbol that can be used instead of a no-op function for types
 * and property overrides that will cause the type or property to be
 * ignored. Any references to other types that would also be included
 * will also be ignored, though they may be included if they are
 * referenced by something else that is not ignored.
 */
export const IGNORE = Symbol();

/**
 * Special symbol that can be used instead of a no-op function in the
 * collection of overrides for properties, that will cause the property
 * to be ignored, but the references of the original schema to continue
 * to be followed.
 */
export const IGNORE_BUT_FOLLOW_REFS = Symbol();
