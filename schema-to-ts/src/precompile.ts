import { type ResolverOptions } from '@apidevtools/json-schema-ref-parser';
import {
  DEFAULT_OPTIONS,
  type Options as JsttOptions,
} from 'json-schema-to-typescript';
import { AST } from 'json-schema-to-typescript/dist/src/types/AST.js';
import { dereference } from 'json-schema-to-typescript/dist/src/resolver.js';
import { link } from 'json-schema-to-typescript/dist/src/linker.js';
import { normalize } from 'json-schema-to-typescript/dist/src/normalizer.js';
import { parse } from 'json-schema-to-typescript/dist/src/parser.js';
import { optimize } from 'json-schema-to-typescript/dist/src/optimizer.js';
import deepmerge from 'deepmerge';

import { logger, prettyName } from './utils.js';
import type { NamedAst, NodeMap, RawSchemaLookup } from './types.js';

/**
 * Produce a map of each named Zapier Schema to a corresponding
 * semi-compiled AST node. These can then be used to inform the full
 * TypeScript declaration file generation.
 *
 * @remarks
 * This produces a compiled node for each schema directly, as opposed to
 * the json-schema-to-typescript library's default behaviour of
 * producing a single TypeScript file given a single root-level schema
 * following references. This is done because we want to produce some
 * finer-grained control over the output, as the library otherwise
 * produces some undesirable comments and references between types.
 *
 * This close but undesirable format has cropped up more than once from
 * a Zapien from many years ago.
 *
 * @see https://github.com/zapier/zapier-platform/issues/8
 * @see https://github.com/bcherny/json-schema-to-typescript/issues/334
 */
export const compileNodesFromSchemas = async (
  schemas: RawSchemaLookup,
): Promise<NodeMap> => {
  const nodeMap = new Map();

  for (const rawSchemaName of Object.keys(schemas)) {
    logger.debug({ rawSchemaName }, 'Pre-compiling %s to Node', rawSchemaName);
    logger.trace(
      { schema: schemas[rawSchemaName] },
      'Raw schema details for %s',
      rawSchemaName,
    );
    const node = await compileToAST(schemas, rawSchemaName);
    if (isNamedNode(node)) {
      const name = prettyName(rawSchemaName);
      logger.trace('Registering %s %s', node.type, name);
      nodeMap.set(name, node);
    } else {
      logger.warn('Schema %s did not compile to a named node!?', rawSchemaName);
    }
  }

  return nodeMap;
};

/**
 * Produce a "Resolver" that can adapt the normal JsonSchema references
 * in a document to be able to retrieve other schemas out of the big
 * flat object of schemas produced by zapier-platform-schema.
 */
const getResolver = (schemas: RawSchemaLookup): Partial<ResolverOptions> => ({
  canRead: true,
  order: 1, // Run before the default resolver.
  read: ({ url }) => {
    const key = url.replace('/', '');

    const result = schemas[key];
    if (!result) {
      logger.error('Could not resolve schema with key %s', key);
    } else {
      logger.trace('Resolved schema with key %s', key);
    }
    return result;
  },
});

/**
 * Compile a Zapier JsonSchema using the json-schema-to-typescript
 * library. We don't want it's default rendered TypeScript output
 * though, so we stop at the abstract syntax tree (AST) level so we can
 * manipulate it further.
 *
 * This implementation is lifted straight from the
 * json-schema-to-typescript library's `compile()` function, stopping
 * just before the code-generation stage.
 */
const compileToAST = async (
  schemas: RawSchemaLookup,
  appKey = 'AppSchema',
): Promise<AST> => {
  const rootSchema = schemas[appKey];
  if (!rootSchema) {
    throw new Error(`App Root Schema Undefined. Check ${appKey} is in schema`);
  }
  const _options: JsttOptions = deepmerge(DEFAULT_OPTIONS, {
    $refOptions: {
      resolve: { customResolver: getResolver(schemas) },
    },
    ignoreMinAndMaxItems: true,
  });
  const _schema = structuredClone(rootSchema);

  const { dereferencedPaths, dereferencedSchema } = await dereference(
    _schema,
    _options,
  );
  const linked = link(dereferencedSchema);
  const normalized = normalize(linked, dereferencedPaths, appKey, _options);
  const parsed = parse(normalized, _options);
  const optimized = optimize(parsed, _options);
  return optimized;
};

const isNamedNode = (node: AST): node is NamedAst => {
  return node.standaloneName !== undefined;
};
