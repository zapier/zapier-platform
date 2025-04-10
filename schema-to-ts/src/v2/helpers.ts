import type { SchemaPath } from './types.ts';
import { lexer } from 'marked';
import { reflowLines } from '../comments.ts';

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
