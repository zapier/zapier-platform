import type { JSONSchema4 } from 'json-schema';
import type { Logger } from 'pino';
import { SourceFile } from 'ts-morph';
import { lexer } from 'marked';
import { logger } from '../utils.ts';
import { reflowLines } from '../comments.ts';

export type TopLevelSchema = JSONSchema4 & { id: string };

export type SchemaPath = `/${string}Schema`; // e.g. /AppSchema

export type CompilerContext = {
  file: SourceFile;
  schemas: Record<string, TopLevelSchema>;
  schemasToRender: SchemaPath[];
  renderedSchemas: Set<SchemaPath>;
};

/**
 * A compiler that can be used to compile a top-level schema into a
 * TypeScript type. May also register other schema types that need to be
 * compiled themselves.
 */
export abstract class SchemaCompiler<$Schema extends TopLevelSchema> {
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

export function idToTypeName(name: string) {
  return name.replace(/^\/?/, '').replace(/Schema$/, '');
}
export function refToSchemaName(name: SchemaPath) {
  return name.replace(/^\/?/, '');
}

export function isSchemaRef(value: unknown): value is SchemaPath {
  return typeof value === 'string' && value.startsWith('/');
}

export function docStringLines(
  comment: string | undefined,
): string[] | undefined {
  if (comment === undefined) {
    return undefined;
  }
  const tokens = lexer(comment);
  return [reflowLines(tokens).join('\n')];
}

/**
 * Used to render the type for a Schema object. Returns a string of the
 * rawType that can be inserted into a TypeScript type, and an optional
 * set of /XyxSchema references that were referenced and will need to be
 * rendered.
 */
export function renderRawType(schema: JSONSchema4): {
  rawType: string;
  referencedTypes?: Set<string>;
} {
  if (schema.$ref) {
    return {
      rawType: idToTypeName(schema.$ref),
      referencedTypes: new Set([schema.$ref]),
    };
  }
  if (schema.type === 'string') {
    return { rawType: 'string' };
  }
  if (schema.type === 'number' || schema.type === 'integer') {
    return { rawType: 'number' };
  }
  if (schema.type === 'boolean') {
    return { rawType: 'boolean' };
  }
  if (schema.type === 'null') {
    return { rawType: 'null' };
  }
  if (schema.type === 'object' && schema.additionalProperties !== false) {
    return { rawType: 'Record<string, unknown>' };
  }

  if (schema.type === 'array') {
    if (schema.items && !Array.isArray(schema.items) && schema.items.$ref) {
      const { rawType, referencedTypes } = renderRawType(schema.items);
      return { rawType: `${rawType}[]`, referencedTypes };
    } else {
      return { rawType: 'unknown[]' };
    }
  }

  logger.error(
    { schema },
    'Unknown union member type: %s',
    JSON.stringify(schema),
  );
  throw new Error(`Unknown union member type: ${JSON.stringify(schema)}`);
}
