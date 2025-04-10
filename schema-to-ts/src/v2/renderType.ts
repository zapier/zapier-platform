import type { JSONSchema4 } from 'json-schema';
import { idToTypeName, type SchemaPath } from './helpers.ts';
import { logger } from '../utils.ts';

type RenderResult = {
  /**
   * The raw type that can be inserted into a TypeScript type.
   */
  rawType: string;

  /**
   * An optional set of /XyxSchema references that were referenced and will need to be
   * rendered.
   */
  referencedTypes?: Set<SchemaPath>;
};

/**
 * Render a JSONSchema object into a TypeScript type. Returns a string
 * of the rawType that can be inserted as raw TypeScript code, and an
 * optional set of /XyxSchema references that were referenced and will
 * need to be rendered.
 */
export default function renderType(schema: JSONSchema4): RenderResult {
  if (schema.$ref) {
    return {
      rawType: idToTypeName(schema.$ref),
      referencedTypes: new Set([schema.$ref as SchemaPath]),
    };
  }
  if (schema.type === 'string') {
    return { rawType: 'string' };
  }
  if (schema.type === 'number' || schema.type === 'integer') {
    return { rawType: 'number' };
  }
  if (schema.type === 'boolean') {
    return { rawType: 'boolean' };
  }
  if (schema.type === 'null') {
    return { rawType: 'null' };
  }
  if (schema.type === 'object') {
    return renderObjectType(schema);
  }

  if (schema.type === 'array') {
    return renderArrayType(schema);
  }

  if (schema.oneOf) {
    return renderOneOfType(schema);
  }
  if (schema.anyOf) {
    return renderAnyOfType(schema);
  }

  logger.error(
    { schema },
    'Schema not supported. Add support to renderType().',
  );
  throw new Error(
    `Schema not supported, add support to renderType(): ${JSON.stringify(schema)}`,
  );
}

/**
 * Renders the type for an object schema.
 */
export const renderObjectType = (schema: JSONSchema4): RenderResult => {
  // PatternProperties become records
  if (schema.patternProperties) {
    if (Object.keys(schema.patternProperties).length !== 1) {
      logger.error(
        { schema },
        'Only PatternProperties with a single entry are supported.',
      );
      throw new Error(
        'Only PatternProperties with a single entry are supported.',
      );
    }
    const [value] = Object.values(schema.patternProperties);
    const { rawType, referencedTypes } = renderType(value!);
    return { rawType: `Record<string, ${rawType}>`, referencedTypes };
  }

  // Unspecified key types.
  if (
    schema.type === 'object' &&
    schema.additionalProperties !== false &&
    !schema.properties
  ) {
    return { rawType: 'Record<string, unknown>' };
  }

  // No properties.
  if (!schema.properties) {
    return { rawType: '{}' };
  }

  const properties = Object.entries(schema.properties).map(
    ([key, value]): RenderResult => {
      const { rawType, referencedTypes } = renderType(value);
      return { rawType: `${key}: ${rawType}`, referencedTypes };
    },
  );
  const rawType = properties.map((p) => p.rawType).join('; ');
  const referencedTypes = new Set(
    properties.flatMap((p) => [...(p.referencedTypes ?? [])]),
  );

  return {
    rawType: `{ ${rawType} }`,
    referencedTypes: referencedTypes.size > 0 ? referencedTypes : undefined,
  };
};

/**
 * Renders the type for an array schema.
 */
const renderArrayType = (schema: JSONSchema4): RenderResult => {
  if (schema.items) {
    const { rawType, referencedTypes } = renderType(schema.items);
    return { rawType: `${rawType}[]`, referencedTypes };
  }
  return { rawType: 'unknown[]' };
};

const renderOneOfType = (schema: JSONSchema4): RenderResult => {
  if (schema.oneOf) {
    const types = schema.oneOf.map((type) => renderType(type));
    const referencedTypes = new Set(
      types.flatMap((t) => [...(t.referencedTypes ?? [])]),
    );
    return {
      rawType: types.map((t) => t.rawType).join(' | '),
      referencedTypes,
    };
  }
  return { rawType: 'unknown' };
};

const renderAnyOfType = (schema: JSONSchema4): RenderResult => {
  if (schema.anyOf) {
    const types = schema.anyOf.map((type) => renderType(type));
    const referencedTypes = new Set(
      types.flatMap((t) => [...(t.referencedTypes ?? [])]),
    );
    return {
      rawType: types.map((t) => t.rawType).join(' | '),
      referencedTypes,
    };
  }
  return { rawType: 'unknown' };
};
