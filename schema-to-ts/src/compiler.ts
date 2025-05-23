import {
  IGNORE,
  IGNORE_BUT_FOLLOW_REFS,
  type AddPropertyContext,
  type CompilerContext,
  type CompilerOptions,
  type SchemaPath,
  type VersionInfo,
} from './types.ts';
import { IMPORTS, INTERFACE_OVERRIDES, TYPE_OVERRIDES } from './overrides.ts';
import { Project, SourceFile } from 'ts-morph';
import { idToTypeName, refToSchemaName } from './utils.ts';

import type { JSONSchema4 } from 'json-schema';
import Statistics from './statistics.ts';
import { docStringLines } from './comments.ts';
import { format } from './formatter.ts';
import fs from 'node:fs';
import { logger } from './utils.ts';
import renderType from './renderType.ts';

export async function compileV3(options: CompilerOptions) {
  const { version, schemas } = JSON.parse(
    fs.readFileSync(options.schemaJson!, 'utf8'),
  );
  logger.info({ version }, 'Loaded %d schemas', Object.keys(schemas).length);

  const project = new Project();
  const file = project.createSourceFile('dummy-value.ts');

  addPreamble(file, {
    compilerVersion: options.compilerVersion,
    platformVersion: version,
  });
  addImports(file);

  const ctx: CompilerContext = {
    file,
    schemas,
    schemasToRender: ['/AppSchema'], // "Entrypoint" schema. More will get added.
    renderedSchemas: new Set(),
    ignoreUnusedOverrides: options.ignoreUnusedOverrides,
    stats: new Statistics(),
  };

  while (ctx.schemasToRender.length > 0) {
    const schemaName = ctx.schemasToRender.shift()!;
    addTopLevelType(ctx, schemaName);
  }

  // Done! Format it with prettier and write it to the output file.
  const rawTypeScript = file.getFullText();
  const formatted = await format(rawTypeScript);
  fs.writeFileSync(options.output!, formatted);
  logger.info({ output: options.output }, 'Wrote generated TypeScript to file');
  reportStatistics(ctx);
}

function reportStatistics(ctx: CompilerContext) {
  const unusedTypeOverrides = ctx.stats.findUnusedTypeOverrides(TYPE_OVERRIDES);
  if (unusedTypeOverrides.length > 0) {
    logger.error({ unused: unusedTypeOverrides }, 'Unused type overrides');
  } else {
    logger.info('All type overrides were used');
  }

  const unusedInterfaceSelfOverrides =
    ctx.stats.findUnusedInterfaceSelfOverrides(INTERFACE_OVERRIDES);
  if (unusedInterfaceSelfOverrides.length > 0) {
    logger.error(
      { unused: unusedInterfaceSelfOverrides },
      'Unused interface signature overrides',
    );
  } else {
    logger.info('All interface signature overrides were used');
  }

  const unusedInterfacePropertyOverrides =
    ctx.stats.findUnusedInterfacePropertyOverrides(INTERFACE_OVERRIDES);
  if (unusedInterfacePropertyOverrides.length > 0) {
    logger.error(
      { unused: unusedInterfacePropertyOverrides },
      'Unused interface property overrides',
    );
  } else {
    logger.info('All interface property overrides were used');
  }

  if (
    unusedTypeOverrides.length > 0 ||
    unusedInterfaceSelfOverrides.length > 0 ||
    unusedInterfacePropertyOverrides.length > 0
  ) {
    if (ctx.ignoreUnusedOverrides !== true) {
      throw new Error(
        'Please make sure all type overrides are invoked, or ignore with --ignore-unused-overrides',
      );
    }
    logger.warn('Ignoring unused overrides');
  }
}

function addPreamble(file: SourceFile, options: VersionInfo) {
  logger.debug({ options }, 'Adding preamble to file');
  const preamble = `/**
* This file was automatically generated by Zapier's schema-to-ts tool.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSON Schema
* files, and/or the schema-to-ts tool and run its CLI to regenerate
* these typings.
* 
* zapier-platform-schema version: ${options.platformVersion}
*  schema-to-ts compiler version: ${options.compilerVersion}
*/`;
  file.insertText(0, (writer) => writer.writeLine(preamble));
}

function addImports(file: SourceFile) {
  logger.debug(
    { modules: IMPORTS.map((i) => i.moduleSpecifier) },
    'Adding %d import sections to file',
    IMPORTS.length,
  );
  file.addImportDeclarations(IMPORTS);
}

function addTopLevelType(ctx: CompilerContext, schemaPath: SchemaPath) {
  const schema = ctx.schemas[refToSchemaName(schemaPath)];
  if (!schema) {
    logger.fatal({ schemaPath }, 'Top-level schema not found');
    throw new Error(`Top-level schema not found: ${schemaPath}`);
  }

  // Skip if we've already added this type.
  if (ctx.renderedSchemas.has(schemaPath)) {
    logger.trace('Skipping already rendered top-level type %s', schemaPath);
    return;
  }
  ctx.renderedSchemas.add(schemaPath);

  if (isInterface(schema)) {
    addInterface(ctx, schemaPath);
  } else {
    addType(ctx, schemaPath);
  }
}

/**
 * Detect if a schema should be rendered as an interface. Otherwise a
 * plain type will be created.
 */
function isInterface(schema: JSONSchema4) {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'type' in schema &&
    schema.type === 'object' &&
    'properties' in schema
  );
}

function addType(ctx: CompilerContext, schemaPath: SchemaPath) {
  const typeName = idToTypeName(schemaPath);
  const schema = ctx.schemas[refToSchemaName(schemaPath)];
  if (!schema) {
    logger.fatal({ schemaPath }, 'Top-level schema not found');
    throw new Error(`Top-level schema not found: ${schemaPath}`);
  }

  const override = TYPE_OVERRIDES[schemaPath];
  if (override) {
    ctx.stats.incTypeOverride(schemaPath);
  }

  if (typeof override === 'function') {
    logger.debug({ typeName }, "Type '%s': using override function", typeName);
    override({
      compilerCtx: ctx,
      file: ctx.file,
      typeName,
      schemaPath,
      schema,
    });
    return;
  }
  logger.debug(
    { typeName, override },
    "Adding default type '%s' %s",
    typeName,
    override ? 'WITH OVERRIDES' : '',
  );

  if (override === IGNORE) {
    return;
  }

  const { rawType, referencedTypes } = renderType(schema);
  if (referencedTypes) {
    ctx.schemasToRender.push(...referencedTypes);
  }

  if (override === IGNORE_BUT_FOLLOW_REFS) {
    return;
  }

  ctx.file.addTypeAlias({
    name: typeName,
    isExported: true,
    docs: docStringLines(schema.description),
    type: rawType,
    leadingTrivia: '\n',
    ...override,
  });
}

function addInterface(ctx: CompilerContext, schemaPath: SchemaPath) {
  const schema = ctx.schemas[refToSchemaName(schemaPath)];
  if (!schema) {
    logger.fatal({ schemaPath }, 'Top-level schema not found');
    throw new Error(`Top-level schema not found: ${schemaPath}`);
  }

  const overrides = INTERFACE_OVERRIDES[schemaPath]?.self;
  if (overrides) {
    ctx.stats.incInterfaceSelfOverride(schemaPath);
  }

  logger.debug(
    { schemaPath, overrides },
    "Adding interface '%s' %s",
    schemaPath,
    overrides ? 'WITH OVERRIDES' : '',
  );

  const iface = ctx.file.addInterface({
    name: idToTypeName(schemaPath),
    isExported: true,
    docs: docStringLines(schema.description),
    ...overrides,
  });

  const requiredProperties = Array.isArray(schema.required)
    ? schema.required
    : [];

  Object.entries(schema.properties ?? {}).forEach(([key, value]) => {
    addInterfaceProperty({
      compilerCtx: ctx,
      iface,
      schemaPath,
      key,
      value,
      isRequired: requiredProperties.includes(key),
    });
  });
}

function addInterfaceProperty(ctx: AddPropertyContext) {
  const { compilerCtx, iface, schemaPath, key, value, isRequired } = ctx;
  let override = INTERFACE_OVERRIDES[schemaPath]?.properties?.[key];

  if (override) {
    compilerCtx.stats.incInterfacePropertyOverride(schemaPath, key);
  }

  if (typeof override === 'function') {
    override(ctx);
    return;
  }

  if (typeof override === 'string') {
    override = { type: override };
  }

  if (override === IGNORE) {
    return;
  }

  const { rawType, referencedTypes } = renderType(value);
  if (referencedTypes) {
    compilerCtx.schemasToRender.push(...referencedTypes);
  }

  if (override === IGNORE_BUT_FOLLOW_REFS) {
    return;
  }

  iface.addProperty({
    name: key,
    type: rawType,
    docs: docStringLines(value.description),
    hasQuestionToken: !isRequired,
    leadingTrivia: '\n',
    ...override,
  });
}
