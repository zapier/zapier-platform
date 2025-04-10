import type { JSONSchema4 } from 'json-schema';
import type { Logger } from 'pino';
import { SourceFile, type CompilerOptions } from 'ts-morph';
import { lexer } from 'marked';
import { logger } from '../utils.ts';
import { reflowLines } from '../comments.ts';

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
