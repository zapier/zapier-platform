import type {
  AST,
  TArray,
  TCustomType,
  TInterface,
  TInterfaceParam,
  TUnion,
} from 'json-schema-to-typescript/dist/src/types/AST.js';
import type { NamedAst, NodeMap } from './types.js';
import { logger, prettyName } from './utils.js';

import { commentToTsDocString } from './comments.js';

/**
 * Convert each top-level "precompiled" node to typescript code, and
 * join them all together into a cohesive .d.ts module. This is mostly a
 * 1-1 interface for each schema, but with some extra pieces that the
 * transformation step may add like headers and function types.
 */
export const generateTypeScript = (typesMap: NodeMap): string => {
  const nodes = Array.from(typesMap.values());
  return nodes.map(genNamedNode).join('\n\n');
};

/** Generate actual TypeScript code from a node. */
const genNamedNode = (node: NamedAst): string => {
  const name = prettyName(node.standaloneName);
  logger.debug(
    { type: node.type, standaloneName: node.standaloneName },
    'Generating top-level %s',
    name,
  );
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

const genComment = (comment: string | undefined): string => {
  const stripped = comment?.trim();
  if (!stripped) return '';
  const result = commentToTsDocString(stripped);
  logger.trace(
    { beforeLength: stripped.length, afterLength: result.length },
    'Formatting top-level comment',
  );
  return result;
};

const genInterfaceParamComment = (comment: string | undefined): string => {
  if (!comment) return '';
  const result = '\n' + commentToTsDocString(comment);
  logger.trace(
    { beforeLength: comment.length, afterLength: result.length },
    'Formatting comment for interface param',
  );
  return result;
};

const PRIMITIVE_TYPES = new Set([
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'ANY',
  'NEVER',
  'NULL',
  'UNKNOWN',
]);

/**
 * Generate the body of a type. Note that the property name, docstring,
 * or colon etc are not generated.
 */
const genType = (typeNode: AST): string => {
  if (typeNode.standaloneName) {
    logger.trace(
      { type: typeNode.type, standaloneName: typeNode.standaloneName },
      'Inserting reference to named type %s',
      typeNode.standaloneName,
    );
    return prettyName(typeNode.standaloneName);
  }

  if (PRIMITIVE_TYPES.has(typeNode.type)) {
    logger.trace(
      { type: typeNode.type },
      'Inserting plain type %s',
      typeNode.type.toLowerCase(),
    );
    return typeNode.type.toLowerCase();
  }

  if (typeNode.type === 'LITERAL') {
    if (typeof typeNode.params !== 'string') {
      logger.warn(`Unsupported literal type: ${typeNode.params}`);
      return `unknown /* Unknown literal ${typeNode.params} */`;
    }
    logger.trace(
      { type: typeNode.type, value: typeNode.params },
      "Inserting string literal type '%s'",
      typeNode.params,
    );
    return `'${typeNode.params}'`;
  }

  logger.trace(
    { type: typeNode.type },
    'Rendering composite type for %s',
    typeNode.type,
  );
  switch (typeNode.type) {
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
  logger.trace(
    { keyName: param.keyName, isRequired: param.isRequired },
    "Rendering interface param '%s': %s",
    param.keyName,
    param.ast.type,
  );
  const comment = genInterfaceParamComment(param.ast.comment);
  const required = param.isRequired ? '' : '?';
  const type = genType(param.ast);
  return `${comment}${param.keyName}${required}: ${type};`;
};

const genNamedInterface = (node: NamedAst<TInterface>): string => {
  const name = prettyName(node.standaloneName);
  logger.trace(
    { prettyName: name, properties: node.params.length, exported: true },
    'Rendering exported interface %s',
    name,
  );
  const comment = genComment(node.comment);
  const properties = node.params.map(genInterfaceParam).join('\n');
  return `${comment}export interface ${name} {${properties}}`;
};

const genNamedString = (node: NamedAst): string => {
  const name = prettyName(node.standaloneName);
  logger.trace({ prettyName: name }, 'Rendering exported string %s', name);
  const comment = genComment(node.comment);
  return `${comment}export type ${name} = string;`;
};

const genNamedUnion = (node: NamedAst<TUnion>): string => {
  const name = prettyName(node.standaloneName);
  logger.trace({ prettyName: name }, 'Rendering exported union %s', name);
  const comment = genComment(node.comment);
  const types = node.params.map(genType).join(' | ');
  return `${comment}export type ${name} = ${types};`;
};

const genNamedArray = (node: NamedAst<TArray>): string => {
  const name = prettyName(node.standaloneName);
  logger.trace({ prettyName: name }, 'Rendering exported array %s', name);
  const comment = genComment(node.comment);
  const type = genType(node.params);
  return `${comment}export type ${name} = (${type})[];`;
};

const genCustomTypeSnippet = (node: NamedAst<TCustomType>): string => {
  const name = prettyName(node.standaloneName);
  const content = node.params.replace('insert-snippet|||', '');
  logger.trace(
    { prettyName: name, size: content.length },
    'Rendering snippet %s',
    name,
  );
  const comment = genComment(node.comment);
  return `${comment}${content}`;
};
