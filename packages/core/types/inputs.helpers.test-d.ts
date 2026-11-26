import { expectError, expectType } from 'tsd';

import type { PlainInputField } from './schemas.generated';
import {
  defineStaticInputField,
  defineKnownInputFieldsFunc,
  defineCustomInputFieldsFunc,
} from './inputs.helpers';

const NUMBER_FIELD = {
  key: 'my_number',
  type: 'number',
  required: true,
} as const satisfies PlainInputField;
type NUMBER_FIELD = typeof NUMBER_FIELD;

const STRING_FIELD = {
  key: 'my_string',
  type: 'string',
  required: true,
} as const satisfies PlainInputField;
type STRING_FIELD = typeof STRING_FIELD;

// Static Input Field Tests
// ========================

// Redundant pass-through still works.
const staticNumberField = defineStaticInputField(NUMBER_FIELD);
expectType<NUMBER_FIELD>(staticNumberField);

const staticStringField = defineStaticInputField(STRING_FIELD);
expectType<STRING_FIELD>(staticStringField);

// Inline definition preserves literal types
const inlineField = defineStaticInputField({
  key: 'inline_field',
  type: 'boolean',
  required: false,
} as const);
expectType<{
  readonly key: 'inline_field';
  readonly type: 'boolean';
  readonly required: false;
}>(inlineField);

// Satisfies pattern works
const satisfiesField = defineStaticInputField({
  key: 'satisfies_field',
  type: 'integer',
  required: true,
} as const satisfies PlainInputField);
expectType<{
  readonly key: 'satisfies_field';
  readonly type: 'integer';
  readonly required: true;
}>(satisfiesField);

// Known Input Field Tests
// =======================

const zeroResults = defineKnownInputFieldsFunc(() => []);
expectType<() => []>(zeroResults);

const oneResult = defineKnownInputFieldsFunc(() => [NUMBER_FIELD]);
expectType<() => [NUMBER_FIELD]>(oneResult);
const multipleResults = defineKnownInputFieldsFunc(() => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => [NUMBER_FIELD, STRING_FIELD]>(multipleResults);

// Conditional returns
const zeroOrMultipleResults = defineKnownInputFieldsFunc(() => {
  if (Math.random() > 0.5) {
    return [NUMBER_FIELD, STRING_FIELD];
  }
  return [];
});
expectType<() => [] | [NUMBER_FIELD, STRING_FIELD]>(zeroOrMultipleResults);

const asyncZeroResults = defineKnownInputFieldsFunc(async () => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(asyncZeroResults);

const asyncOneResult = defineKnownInputFieldsFunc(async () => [NUMBER_FIELD]);
expectType<() => Promise<[NUMBER_FIELD]>>(asyncOneResult);

const asyncMultipleResults = defineKnownInputFieldsFunc(async () => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(asyncMultipleResults);

const asyncConstTuple = defineKnownInputFieldsFunc(
  async () => [NUMBER_FIELD, STRING_FIELD] as const,
);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(asyncConstTuple);

const asyncZeroOrMultipleResults = defineKnownInputFieldsFunc(async () => {
  if (Math.random() > 0.5) {
    return [NUMBER_FIELD, STRING_FIELD];
  }
  return [];
});
expectType<() => Promise<[] | [NUMBER_FIELD, STRING_FIELD]>>(
  asyncZeroOrMultipleResults,
);

// Known Input Field Errors
// ========================

// ❌ Error: not a tuple
const fields: PlainInputField[] = [];
expectError(defineKnownInputFieldsFunc(() => fields));

// ❌ Error: number[] is not a tuple
expectError(
  defineKnownInputFieldsFunc(() => {
    if (Math.random() > 0.5) {
      return [NUMBER_FIELD, STRING_FIELD];
    }
    // must return a tuple, even if empty
  }),
);

// Unknown Input Field Tests
// =========================

const zeroResultsUnknown = defineCustomInputFieldsFunc(() => []);
expectType<() => []>(zeroResultsUnknown);

const oneResultUnknown = defineCustomInputFieldsFunc(() => [NUMBER_FIELD]);
expectType<() => [NUMBER_FIELD]>(oneResultUnknown);
const multipleResultsUnknown = defineCustomInputFieldsFunc(() => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => [NUMBER_FIELD, STRING_FIELD]>(multipleResultsUnknown);

// Conditional returns
const zeroOrMultipleResultsUnknown = defineCustomInputFieldsFunc(() => {
  if (Math.random() > 0.5) {
    return [NUMBER_FIELD, STRING_FIELD];
  }
  return [];
});
expectType<() => [] | [NUMBER_FIELD, STRING_FIELD]>(
  zeroOrMultipleResultsUnknown,
);

const asyncZeroResultsUnknown = defineCustomInputFieldsFunc(async () => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(
  asyncZeroResultsUnknown,
);

const asyncOneResultUnknown = defineCustomInputFieldsFunc(async () => [
  NUMBER_FIELD,
]);
expectType<() => Promise<[NUMBER_FIELD]>>(asyncOneResultUnknown);

const asyncMultipleResultsUnknown = defineCustomInputFieldsFunc(async () => [
  NUMBER_FIELD,
  STRING_FIELD,
]);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(
  asyncMultipleResultsUnknown,
);

const asyncConstTupleUnknown = defineCustomInputFieldsFunc(
  async () => [NUMBER_FIELD, STRING_FIELD] as const,
);
expectType<() => Promise<[NUMBER_FIELD, STRING_FIELD]>>(asyncConstTupleUnknown);

const asyncZeroOrMultipleResultsUnknown = defineCustomInputFieldsFunc(
  async () => {
    if (Math.random() > 0.5) {
      return [NUMBER_FIELD, STRING_FIELD];
    }
    return [];
  },
);
expectType<() => Promise<[] | [NUMBER_FIELD, STRING_FIELD]>>(
  asyncZeroOrMultipleResultsUnknown,
);

expectType<() => PlainInputField[]>(
  defineCustomInputFieldsFunc(() => {
    const fields: PlainInputField[] = [];
    return fields;
  }),
);

expectType<() => PlainInputField[]>(
  defineCustomInputFieldsFunc(
    () => [NUMBER_FIELD, STRING_FIELD] as PlainInputField[],
  ),
);
