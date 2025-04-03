import type {
  CompilerOptions,
  RawSchemaLookup,
  ZapierSchemaDocument,
} from './types.js';
import { existsSync, readFileSync } from 'fs';

import { applyAllTransformations } from './transformers.js';
import { compileNodesFromSchemas } from './precompile.js';
import { format } from './formatter.js';
import { generateTypeScript } from './generation.js';
import { logger } from './utils.js';

/**
 * The top-level interface for converting a collection of schemas into
 * TypeScript code.
 *
 * @remarks
 * This function does not handle reading the schemas from
 * `exported-schema.json`, nor does it output to a file on disk. Other
 * functions and the CLI code itself handles that.
 */
export const compile = async (
  schemas: RawSchemaLookup,
  options: CompilerOptions,
): Promise<string> => {
  // Compile the schemas into a collection of AST nodes to work with.
  // There is one node for each schema at this stage, and they are in a
  // format that we still want to improve, as the
  // json-schema-to-typescript library does most of the work but has
  // some undesirable results.
  logger.debug('Generating pre-compiled node map');
  const nodeMap = await compileNodesFromSchemas(schemas);
  logger.info({ nodes: nodeMap.size }, 'Generated pre-compiled node map');

  // "Transform" the compiled schemas from a raw AST format into more
  // usable nodes. This is where we cleanup comments, add links to the
  // public docs, and add references to the pre-existing
  // zapier-platform-core types.
  logger.debug('Applying transformations to node map');
  const improvedNodeMap = applyAllTransformations(nodeMap, options);
  logger.info(
    { nodes: improvedNodeMap.size },
    'Applied all transformations to node map',
  );

  // Convert the nodes into a string containing real TypeScript code.
  logger.debug('Generating TypeScript from transformed node map');
  const rawTypeScript = generateTypeScript(improvedNodeMap);
  logger.info({ length: rawTypeScript.length }, 'Generated raw TypeScript');

  // Format the TypeScript with Prettier before writing it to a file.
  // Necessary because the code-generation step is rather messy.
  logger.debug('Formatting generated TypeScript with Prettier');
  const typescript = await format(rawTypeScript);
  logger.info(
    { length: typescript.length },
    'Formatted generated TypeScript with Prettier',
  );

  return typescript;
};

export const loadExportedSchemas = (
  schemaJsonPath: string,
): ZapierSchemaDocument => {
  if (!existsSync(schemaJsonPath)) {
    logger.fatal(
      { schemaJsonPath },
      'Schema-json file does not exist, aborting',
    );
    throw new Error(`Schema-json file does not exist: ${schemaJsonPath}`);
  } else {
    logger.info(
      { schemaJsonPath },
      'Successfully found schema-json file to compile.',
    );
  }

  const { version, schemas } = JSON.parse(
    readFileSync(schemaJsonPath, 'utf-8'),
  );
  logger.info(
    {
      schemaJsonPath,
      version,
      numRawSchemas: Object.keys(schemas).length,
    },
    'Loaded %d raw JsonSchemas from zapier-platform-schemas v%s to compile',
    Object.keys(schemas).length,
    version,
  );

  return { version, schemas };
};
