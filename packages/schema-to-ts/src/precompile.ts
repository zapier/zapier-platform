import { type ResolverOptions } from "@bcherny/json-schema-ref-parser";
import { DEFAULT_OPTIONS, type Options } from "json-schema-to-typescript";
import { AST } from "json-schema-to-typescript/dist/src/types/AST.js";
import { dereference } from "json-schema-to-typescript/dist/src/resolver.js";
import { link } from "json-schema-to-typescript/dist/src/linker.js";
import { normalize } from "json-schema-to-typescript/dist/src/normalizer.js";
import { parse } from "json-schema-to-typescript/dist/src/parser.js";
import { optimize } from "json-schema-to-typescript/dist/src/optimizer.js";
import deepmerge from "deepmerge";

import ZPS from "zapier-platform-schema";

import { logger, prettyName } from "./utils.js";
import type { NamedAst, NodeMap, RawSchemaLookup } from "./types.js";

/**
 * Produce a "Resolver" that can adapt the normal JsonSchema references
 * in a document to be able to retrieve other schemas out of the big
 * flat object of schemas produced by zapier-platform-schema.
 */
const getResolver = (schemas: RawSchemaLookup): Partial<ResolverOptions> => ({
  canRead: true,
  order: 1,
  read: ({ url }) => {
    const key = url.replace("/", "");

    const result = schemas[key];
    if (!result) {
      console.warn("Could not resolve schema with key %s", key);
    } else {
      logger.trace("Resolved schema with key %s", key);
    }
    return result;
  },
});

/**
 * Compile a Zapier JsonSchema using the json-schema-to-typescript
 * library. We don't want it's default rendered TypeScript output
 * though, so we stop at the abstract syntax tree (AST) level so we can
 * manipulate it further.
 */
const compileToAST = async (
  schemas: RawSchemaLookup,
  appKey = "AppSchema",
): Promise<AST> => {
  const rootSchema = schemas[appKey];
  if (!rootSchema) {
    throw new Error(`App Root Schema Undefined. Check ${appKey} is in schema`);
  }
  const _options: Options = deepmerge(DEFAULT_OPTIONS, {
    $refOptions: {
      resolve: { customResolver: getResolver(schemas) },
    },
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

const updateTypeMapRecursive = (
  node: AST,
  schemas: RawSchemaLookup,
  types: NodeMap,
) => {
  if (isNamedNode(node)) {
    const name = prettyName(node.standaloneName);

    if (types.has(name)) {
      // We've seen this type before, no need to re-register or traverse it.
      logger.trace("Skipping registering %s %s", node.type, name);
      return;
    } else {
      logger.debug("Registering %s %s", node.type, name);
      types.set(name, node);
    }
  } else {
    logger.trace("Traversing unnamed %s node", node.type);
  }

  // Traverse Composite node types' children, exploring the tree more
  // deeply.
  switch (node.type) {
    case "INTERFACE":
      node.params.forEach((param) => {
        updateTypeMapRecursive(param.ast, schemas, types);
      });
      break;
    case "UNION":
      node.params.forEach((param) => {
        updateTypeMapRecursive(param, schemas, types);
      });
      break;
    case "ARRAY":
      updateTypeMapRecursive(node.params, schemas, types);
      break;
    case "TUPLE":
      node.params.forEach((param) => {
        updateTypeMapRecursive(param, schemas, types);
      });
      if (node.spreadParam) {
        updateTypeMapRecursive(node.spreadParam, schemas, types);
      }
      break;
    case "BOOLEAN":
    case "LITERAL":
    case "NUMBER":
    case "NULL":
    case "STRING":
      logger.debug("Ignoring Primitive Type %s", node.type);
      break;
    default:
      logger.debug("Attempted to traverse %s Node", node.type, {
        unhandledNode: node,
      });
    // throw new Error(`Unhandled node type ${node.type}`);
  }
};

/**
 * Produce a map of each named Zapier Schema to a corresponding
 * semi-compiled AST node. These can then be used to inform the full
 * TypeScript declaration file generation.
 */
export const compileNodesFromSchemas = async (
  schemas: RawSchemaLookup,
): Promise<NodeMap> => {
  const nodeMap = new Map();

  for (const key of Object.keys(schemas)) {
    logger.debug("Pre-compiling %s to Node", key);
    const ast = await compileToAST(schemas, key);
    if (isNamedNode(ast)) {
      const name = prettyName(key);
      logger.trace("Registering %s %s", ast.type, name);
      nodeMap.set(name, ast);
    } else {
      logger.warn("Schema %s did not compile to a named node!?", key);
    }
  }

  return nodeMap;
};

/**
 * Get the collection of schema objects from the zapier-platform-schema
 * library. This is a fallback in case the exported schema file is not
 * directly provided.
 */
export const getZpsRawSchemas = async (): Promise<RawSchemaLookup> => {
  const { schemas } = ZPS.exportSchema();
  return schemas;
};
