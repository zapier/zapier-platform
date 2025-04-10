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
