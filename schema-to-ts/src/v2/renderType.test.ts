import { describe, expect, it } from 'vitest';

import type { JSONSchema4 } from 'json-schema';
import type { SchemaPath } from './types.ts';
import renderType from './renderType.ts';

describe('type rendering', () => {
  it.each<[JSONSchema4, string]>([
    [{ $ref: '/FoobarSchema' }, 'Foobar'],
    [{ type: 'string' }, 'string'],
    [{ type: 'number' }, 'number'],
    [{ type: 'integer' }, 'number'],
    [{ type: 'boolean' }, 'boolean'],
    [{ type: 'null' }, 'null'],
  ])('renders basic type of %s', (schema, expected) => {
    const result = renderType(schema);
    expect(result.rawType).toBe(expected);
  });

  it.each<[JSONSchema4, string]>([
    [{ type: 'array' }, 'unknown[]'],
    [{ type: 'array', items: { type: 'string' } }, 'string[]'],
  ])('renders array type of %s', (schema, expected) => {
    const result = renderType(schema);
    expect(result.rawType).toBe(expected);
  });

  it.each<[JSONSchema4, string]>([
    [{ type: 'object', additionalProperties: false }, '{}'],
    [{ type: 'object' }, 'Record<string, unknown>'],
    [{ type: 'object', additionalProperties: true }, 'Record<string, unknown>'],
    [
      { type: 'object', properties: { name: { type: 'string' } } },
      '{ name: string }',
    ],
    [{ type: 'object', additionalProperties: false }, '{}'],
    [{ type: 'object', additionalProperties: true }, 'Record<string, unknown>'],
    [
      {
        type: 'object',
        additionalProperties: false,
        properties: { name: { type: 'string' } },
      },
      '{ name: string }',
    ],
    [
      {
        type: 'object',
        additionalProperties: false,
        properties: { name: { type: 'string' }, age: { type: 'number' } },
      },
      '{ name: string; age: number }',
    ],
    [
      {
        type: 'object',
        patternProperties: {
          '^[a-zA-Z]+[a-zA-Z0-9]*$': { type: 'string' },
        },
        additionalProperties: false,
      },
      'Record<string, string>',
    ],
  ])('renders object type of %s', (schema, expected) => {
    const result = renderType(schema);
    expect(result.rawType).toBe(expected);
  });

  it.each<[JSONSchema4, string]>([
    [{ oneOf: [{ type: 'string' }] }, 'string'],
    [{ oneOf: [{ type: 'string' }, { type: 'number' }] }, 'string | number'],
    [
      { oneOf: [{ type: 'string' }, { $ref: '/FoobarSchema' }] },
      'string | Foobar',
    ],
    [{ anyOf: [{ type: 'string' }] }, 'string'],
    [{ anyOf: [{ type: 'string' }, { type: 'number' }] }, 'string | number'],
    [
      { anyOf: [{ type: 'string' }, { $ref: '/FoobarSchema' }] },
      'string | Foobar',
    ],
  ])('renders union type of %s', (schema, expected) => {
    const result = renderType(schema);
    expect(result.rawType).toBe(expected);
  });
});

describe('reference extraction', () => {
  it.each<[JSONSchema4]>([
    [{ type: 'string' }],
    [{ type: 'number' }],
    [{ type: 'integer' }],
    [{ type: 'boolean' }],
    [{ type: 'object', properties: { name: { type: 'string' } } }],
  ])('Does not extract anything from %s', (schema) => {
    const result = renderType(schema);
    expect(result.referencedTypes).toBeUndefined();
  });

  it.each<[JSONSchema4, Set<SchemaPath> | undefined]>([
    [{ $ref: '/FoobarSchema' }, new Set(['/FoobarSchema'])],
    [
      { type: 'array', items: { $ref: '/FoobarSchema' } },
      new Set(['/FoobarSchema']),
    ],
    [
      {
        type: 'object',
        properties: { name: { $ref: '/FoobarSchema' } },
      },
      new Set(['/FoobarSchema']),
    ],
    [{ oneOf: [{ $ref: '/FoobarSchema' }] }, new Set(['/FoobarSchema'])],
    [
      {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { $ref: '/FoobarSchema' } },
        ],
      },
      new Set(['/FoobarSchema']),
    ],
    [{ anyOf: [{ $ref: '/FoobarSchema' }] }, new Set(['/FoobarSchema'])],
  ])('Extracts references from %s', (schema, expected) => {
    const result = renderType(schema);
    expect(result.referencedTypes).toEqual(expected);
  });
});
