import {
  TArray,
  TInterface,
  TUnion,
} from 'json-schema-to-typescript/dist/src/types/AST.js';
import { CompilerOptions, NamedAst, NodeMap } from './types.js';
import { insertAtFront, logger } from './utils.js';

/**
 * A transformer that takes a node and can return a new node with
 * changes made.
 */
type NodeTransformer = (node: NamedAst, options: CompilerOptions) => NamedAst;

/**
 * A transformer that takes a whole map of nodes and can return a new
 * map with changes made. Allows for more complex transformations that
 * add or remove top-level schema nodes.
 */
type MapTransformer = (nodeMap: NodeMap, options: CompilerOptions) => NodeMap;

/**
 * Converts a NodeTransformer into a MapTransformer that applies the
 * node transformer to every node in the map.
 */
const makeMapTransformer =
  (transformer: NodeTransformer): MapTransformer =>
  (nodeMap, options) =>
    new Map(
      Array.from(nodeMap.entries()).map(([key, node]) => [
        key,
        transformer(node, options),
      ]),
    );

/**
 * The global, ordered collection of transformers that are registered to
 * transform the schema nodes before they are converted into TypeScript.
 */
const mapTransformers: Map<string, MapTransformer> = new Map();

mapTransformers.set(
  'add-github-links',
  makeMapTransformer((node) => {
    const comment = node.comment ?? '';
    // TODO: This will occasionally produce a dead link for the schemas
    // that are hidden from the public docs.

    // TODO: This links to the raw schemas, which are fine but very raw.
    // We could also investigate linking to relevant sections of the
    // main platform docs, but that would require human discretion to
    // get right.
    const url = `https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#${node.standaloneName}`;
    return {
      ...node,
      comment: `${comment}\n\n[Docs: ${node.standaloneName}](${url})`,
    };
  }),
);

mapTransformers.set(
  'patch-before-request-middleware-type',
  makeMapTransformer((node) => {
    if (node.standaloneName !== 'AppSchema' || node.type !== 'INTERFACE') {
      return node; // Leave every other node unchanged.
    }

    logger.debug('App Interface node found, will patch `beforeRequest`');

    const toReplace = node.params.find((n) => n.keyName === 'beforeRequest');
    if (!toReplace) {
      logger.warn("beforeRequest not found in App node params, won't patch");
    }

    const newParams = node.params.map((param) => {
      if (param.keyName !== 'beforeRequest') {
        return param; // Leave every other param unchanged.
      }

      logger.debug(
        'Patching beforeRequest param to `BeforeRequestMiddleware | BeforeRequestMiddleware[]`',
      );
      return {
        ...param,
        isPatternProperty: false,
        keyName: 'beforeRequest',
        isRequired: false,
        isUnreachableDefinition: false,
        ast: {
          // OMIT the standaloneName, as this will shortcut to just
          // a reference to the named `Middlewares` type.
          comment: param.ast.comment,
          keyName: param.ast.keyName,
          deprecated: param.ast.deprecated,
          type: 'UNION',
          params: [
            namedReferenceNode('BeforeRequestMiddleware'),
            {
              type: 'ARRAY',
              params: namedReferenceNode('BeforeRequestMiddleware'),
            } satisfies TArray,
          ],
        } satisfies TUnion,
      };
    });
    return {
      ...node,
      params: newParams,
    } satisfies TInterface;
  }),
);

mapTransformers.set(
  'patch-after-response-middleware-type',
  makeMapTransformer((node) => {
    if (node.standaloneName !== 'AppSchema' || node.type !== 'INTERFACE') {
      return node; // Leave every other node unchanged.
    }

    logger.debug('App Interface node found, will patch `afterResponse`');

    const toReplace = node.params.find((n) => n.keyName === 'afterResponse');
    if (!toReplace) {
      logger.warn("afterResponse not found in App node params, won't patch");
    }

    const newParams = node.params.map((param) => {
      if (param.keyName !== 'afterResponse') {
        return param; // Leave every other param unchanged.
      }

      logger.debug(
        'Patching afterResponse param to `AfterResponseMiddleware | AfterResponseMiddleware[]`',
      );
      return {
        ...param,
        isPatternProperty: false,
        keyName: 'afterResponse',
        isRequired: false,
        isUnreachableDefinition: false,
        ast: {
          // OMIT the standaloneName, as this will shortcut to just
          // a reference to the named `Middlewares` type.
          comment: param.ast.comment,
          keyName: param.ast.keyName,
          deprecated: param.ast.deprecated,
          type: 'UNION',
          params: [
            namedReferenceNode('AfterResponseMiddleware'),
            {
              type: 'ARRAY',
              params: namedReferenceNode('AfterResponseMiddleware'),
            } satisfies TArray,
          ],
        } satisfies TUnion,
      };
    });
    return {
      ...node,
      params: newParams,
    } satisfies TInterface;
  }),
);

mapTransformers.set(
  'patch-perform-function-types',
  makeMapTransformer((node, options) => {
    // Search for the "FunctionSchema" JsonSchema, and patch in a
    // reference to the (also injected) `PerformFunction` type.
    if (node.standaloneName !== 'FunctionSchema' || node.type !== 'UNION') {
      return node;
    }
    if (options.skipPatchPerformFunction) {
      return node;
    }

    const performFuncReference: NamedAst = {
      standaloneName: 'PerformFunction',
      type: 'CUSTOM_TYPE',
      params: `func-ref:perform`,
    };
    return {
      ...node,
      // instead of the union of types in node.params, replace it with
      // a single reference to the PerformFunction type. A single-item
      // union then becomes a simple reference.
      params: [performFuncReference],
    } satisfies TUnion;
  }),
);

const CUSTOM_IMPORT_MEMBERS = [
  'AfterResponseMiddleware',
  'BeforeRequestMiddleware',
  'PerformFunction',
];

mapTransformers.set('add-custom-imports', (nodeMap, options) => {
  const customImportNode = snippetNode({
    content: `import type {${CUSTOM_IMPORT_MEMBERS.join(', ')}} from "${options.platformCoreCustomImport}";`,
    name: 'Custom Type Imports',
  });
  logger.debug(
    {
      CUSTOM_IMPORT_MEMBERS,
      platformCoreCustomImport: options.platformCoreCustomImport,
    },
    'Injecting custom imports snippet as first node in the file.',
  );
  return insertAtFront(nodeMap, '_custom_imports', customImportNode);
});

mapTransformers.set('inject-preamble', (nodeMap, options) => {
  const header = `/**
 * This file was automatically generated by Zapier's schema-to-ts tool.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema
 * files, and/or the schema-to-ts tool and run its CLI to regenerate
 * these typings.
 * 
 * zapier-platform-schema version: ${options.platformVersion}
 *  schema-to-ts compiler version: ${options.compilerVersion}
 */`;

  const docNode = snippetNode({ content: header, name: 'File Header' });
  logger.debug('Injecting preamble snippet as first node in the file.');
  return insertAtFront(nodeMap, '_header', docNode);
});

export const applyAllTransformations = (
  nodeMap: NodeMap,
  options: CompilerOptions,
): NodeMap => {
  if (options.skipPatchPerformFunction) {
    logger.warn(
      { skipPatchPerformFunction: options.skipPatchPerformFunction },
      'Skipping patch-functions transformer because of --skip-patch-functions ',
    );
    mapTransformers.delete('patch-perform-function-types');
  }

  logger.info(
    {
      numTransformations: mapTransformers.size,
      transformations: Array.from(mapTransformers.keys()),
    },
    '%d transformations registered to be applied',
    mapTransformers.size,
  );
  return Array.from(mapTransformers.entries()).reduce(
    (nm, [name, transformer]): NodeMap => {
      logger.info(`Applying transformer: ${name}`);
      return transformer(nm, options);
    },
    nodeMap,
  );
};

/**
 * Make a node that will just insert a reference to another named type
 * when the TypeScript is generated.
 */
const namedReferenceNode = (standaloneName: string): NamedAst => ({
  type: 'CUSTOM_TYPE',
  standaloneName,
  params: `ref:${standaloneName}`,
});

/**
 * Make a node with a CUSTOM_TYPE and a special param prefix that the
 * code generation step will know to extract and insert as a snippet of
 * content directly into the final TypeScript file.
 */
const snippetNode = ({
  content,
  name,
  comment,
}: {
  content: string;
  name?: string;
  comment?: string;
}): NamedAst => ({
  type: 'CUSTOM_TYPE',
  standaloneName: `«Snippet: ${name ?? '(anonymous)'}»`,
  comment,
  params: `insert-snippet|||${content}`,
});
