import type { CompilerContext, TopLevelSchema } from '../helpers.ts';

import type { InterfaceDeclaration } from 'ts-morph';
import type { JSONSchema4 } from 'json-schema';
import type { Logger } from 'pino';
import { logger } from '../../utils.ts';

/**
 * A compiler that can be used to compile a top-level schema into a
 * TypeScript type. May also register other schema types that need to be
 * compiled themselves.
 */
export abstract class TopLevelPlugin<$Schema extends TopLevelSchema> {
  protected logger: Logger;
  constructor() {
    this.logger = logger.child({
      compiler: this.constructor.name,
    });
  }

  /**
   * Determine if this compiler should handle the given schema.
   */
  abstract test(schema: TopLevelSchema): schema is $Schema;

  /**
   * Implement this method to compile the schema.
   */
  abstract compile(ctx: CompilerContext, schema: $Schema): void;
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
  abstract test(ctx: PropertyPluginContext): boolean;

  abstract compile(ctx: PropertyPluginContext): void;
}
