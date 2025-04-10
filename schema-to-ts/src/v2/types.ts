import type { InterfaceDeclaration, SourceFile } from 'ts-morph';

import type { JSONSchema4 } from 'json-schema';
import type { Logger } from 'pino';
import { logger } from '../utils.ts';

export type TopLevelSchema = JSONSchema4 & { id: string };

export type SchemaPath = `/${string}Schema`; // e.g. /AppSchema

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
};

export interface TopLevelPluginContext extends CompilerContext {
  /**
   * The path of the schema that is being rendered. In the format
   * "/XyzSchema".
   */
  schemaPath: SchemaPath;

  /**
   * The schema that is being rendered.
   */
  schema: TopLevelSchema;
}

/**
 * A plugin that can be used to render top-level schema into TypeScript
 * types. It may also register other schema types that need to be
 * rendered themselves.
 */
export abstract class TopLevelPlugin {
  protected logger: Logger;
  constructor() {
    this.logger = logger.child({
      topLevelPlugin: this.constructor.name,
    });
  }

  /**
   * Determine if this plugin should handle the given schema.
   */
  abstract test(ctx: TopLevelPluginContext): boolean;

  /**
   * Implement this method to render the schema.
   */
  abstract render(ctx: TopLevelPluginContext): void;
}

/**
 * Everything needed for a property plugin to decide and then optionally
 * render a property.
 */
export interface PropertyPluginContext extends CompilerContext {
  /**
   * Raw interface node that is being rendered. The object properties
   * will be added to to affect the rendered interface.
   */
  iface: InterfaceDeclaration;

  /** Name of the parent interface that is being rendered. */
  interfaceName: string;

  /** Name of the property that is being rendered. */
  key: string;

  /** Whether the property is required. */
  required: boolean;

  /** The JSONSchema node of the property's value. */
  value: JSONSchema4;
}

/**
 * The Interface Plugin itself will use a series of PropertyPlugins to
 * handle special properties of the interface.
 */
export abstract class PropertyPlugin {
  /**
   * Determine if this plugin should handle the given property.
   */
  abstract test(ctx: PropertyPluginContext): boolean;

  /**
   * Actually render the property, attaching it to the interface.
   */
  abstract render(ctx: PropertyPluginContext): void;
}
