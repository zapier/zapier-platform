import type {
  AST,
  TArray,
  TCustomType,
  TInterface,
  TInterfaceParam,
  TUnion,
} from 'json-schema-to-typescript/dist/src/types/AST.js';
import { logger, prettyName } from './utils.js';

import { NamedAst } from './types.js';
import { commentToTsDocString } from './comments.js';

const genComment = (comment: string | undefined): string => {
  const stripped = comment?.trim();
  if (!stripped) return '';

  return commentToTsDocString(stripped);
};

const genInterfaceParamComment = (comment: string | undefined): string => {
  if (!comment) return '';
  return '\n' + commentToTsDocString(comment);
};

/**
 * Generate the body of a type. Note that the property name, docstring,
 * or colon etc are not generated.
 */
const genType = (typeNode: AST): string => {
  if (typeNode.standaloneName) {
    return prettyName(typeNode.standaloneName);
  }

  switch (typeNode.type) {
    case 'STRING':
      return 'string';
    case 'NUMBER':
      return 'number';
    case 'BOOLEAN':
      return 'boolean';
    case 'ANY':
      return 'any';
    case 'NEVER':
      return 'never';
    case 'NULL':
      return 'null';
    case 'UNKNOWN':
      return 'unknown';
    case 'UNION':
      return typeNode.params.map(genType).join(' | ');
    case 'TUPLE':
      const positionalTypes = typeNode.params.map(genType);
      const spreadType = typeNode.spreadParam
        ? genType(typeNode.spreadParam)
        : '';
      return `[${positionalTypes.join(', ')}, ...(${spreadType})[]]`;
    case 'INTERFACE':
      return `{${typeNode.params.map(genInterfaceParam).join('\n')}}`;
    case 'ARRAY':
      return `(${genType(typeNode.params)})[]`;
    case 'LITERAL':
      if (typeof typeNode.params !== 'string') {
        logger.warn(`Unsupported literal type: ${typeNode.params}`);
        return `unknown /* Unknown literal ${typeNode.params} */`;
      }
      return `'${typeNode.params}'`;
    case 'CUSTOM_TYPE':
      if (typeNode.params.startsWith('insert-snippet|||')) {
        const snippet = typeNode.params.replace('insert-snippet|||', '');
        return snippet;
      }
      logger.error(`Unsupported CUSTOM_TYPE Node: ${typeNode.params}`);
    default:
      logger.error(`Unsupported anonymous type: ${typeNode.type}`);
  }

  return 'undefined /* TODO: Implement me! */\n';
};

const genInterfaceParam = (param: TInterfaceParam): string => {
  const comment = genInterfaceParamComment(param.ast.comment);
  const required = param.isRequired ? '' : '?';
  const type = genType(param.ast);

  return `${comment}${param.keyName}${required}: ${type};`;
};

const genNamedInterface = (node: NamedAst<TInterface>): string => {
  const comment = genComment(node.comment);
  const name = prettyName(node.standaloneName);
  const properties = node.params.map(genInterfaceParam).join('\n');
  return `${comment}export interface ${name} {${properties}}`;
};

const genNamedString = (node: NamedAst): string => {
  const comment = genComment(node.comment);
  const name = prettyName(node.standaloneName);
  return `${comment}export type ${name} = string;`;
};

const genNamedUnion = (node: NamedAst<TUnion>): string => {
  const comment = genComment(node.comment);
  const name = prettyName(node.standaloneName);
  const types = node.params.map(genType).join(' | ');
  return `${comment}export type ${name} = ${types};`;
};

const genNamedArray = (node: NamedAst<TArray>): string => {
  const comment = genComment(node.comment);
  const name = prettyName(node.standaloneName);
  const type = genType(node.params);
  return `${comment}export type ${name} = (${type})[];`;
};

const genCustomTypeSnippet = (node: NamedAst<TCustomType>): string => {
  const comment = genComment(node.comment);
  const snippet = node.params.replace('insert-snippet|||', '');
  return `${comment}${snippet}`;
};

/**
 * Generate actual TypeScript code from a node.
 */
const genNamedNode = (node: NamedAst): string => {
  const name = prettyName(node.standaloneName);
  logger.debug(
    { type: node.type, standaloneName: node.standaloneName },
    'Generating code for %s',
    name,
  );
  logger.trace({ node }, 'Raw node details for %s', name);
  switch (node.type) {
    case 'INTERFACE':
      return genNamedInterface(node);
    case 'STRING':
      return genNamedString(node);
    case 'UNION':
      return genNamedUnion(node);
    case 'ARRAY':
      return genNamedArray(node);
    case 'CUSTOM_TYPE':
      if (node.params.startsWith('insert-snippet|||')) {
        return genCustomTypeSnippet(node);
      }
      logger.warn(
        { type: node.type, standaloneName: node.standaloneName },
        'Unsupported named node (custom): %s',
        name,
      );
    default:
      logger.fatal(
        { type: node.type, standaloneName: node.standaloneName },
        'Unsupported named node: %s. Cannot convert to TypeScript code.',
        name,
      );
  }
  throw new Error(`Cannot generate code for node: ${name} (${node.type})`);
};

export const generateTypeScript = (typesMap: Map<string, NamedAst>): string => {
  const nodes = Array.from(typesMap.values());
  return nodes.map(genNamedNode).join('\n\n');
};
