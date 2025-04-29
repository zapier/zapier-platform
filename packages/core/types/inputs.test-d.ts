// Input Typing Tests
// ==================
//
// This is the tests for going from arrays of input field definitions,
// to the shape of `bundle.inputData`. Input Field definitions can be
// "plain" fields, or functions that return arrays of plain fields, sync
// or async.

import type {
  InferInputData,
  InputFieldFunctionWithInputs,
  InputFields,
} from './inputs';
import type { PlainInputField } from './schemas.generated';

import { expectAssignable, expectType } from 'tsd';
import { defineInput, defineInputs } from './typeHelpers';

//
// Test for when `type` is not set, the field defaults to `string`.
const defaultStringInputs = [
  { key: 'default_string' },
] as const satisfies InputFields;
const defaultStringResult1: InferInputData<typeof defaultStringInputs> = {
  default_string: 'a',
};
const defaultStringResult2: InferInputData<typeof defaultStringInputs> = {
  default_string: undefined,
};
expectAssignable<{ default_string?: string }>(defaultStringResult1);
expectAssignable<{ default_string?: string }>(defaultStringResult2);

//
// Tests for `required` combinations.
const requiredComboInputs = [
  { key: 'required_true', required: true },
  { key: 'required_false', required: false },
  { key: 'required_omitted' }, // Will also be optional.
] as const satisfies InputFields;

const requiredComboResult1: InferInputData<typeof requiredComboInputs> = {
  required_true: 'a',
  required_omitted: 'b',
};
expectAssignable<{
  required_true: string;
  required_false?: string;
  required_omitted?: string;
}>(requiredComboResult1);

//
// Test available types.
const typeComboInputs = [
  { key: 'string_type', type: 'string', required: true },
  { key: 'text_type', type: 'text', required: true },
  { key: 'password_type', type: 'password', required: true },
  { key: 'code_type', type: 'code', required: true },
  { key: 'number_type', type: 'number', required: true },
  { key: 'integer_type', type: 'integer', required: true },
  { key: 'boolean_type', type: 'boolean', required: true },
  { key: 'datetime_type', type: 'datetime', required: true },
  { key: 'file_type', type: 'file', required: true },
] as const satisfies InputFields;
const typeComboResult: InferInputData<typeof typeComboInputs> = {
  string_type: 'a',
  text_type: 'b',
  password_type: 'c',
  code_type: 'd',
  number_type: 1,
  integer_type: 2,
  boolean_type: true,
  datetime_type: 'datetime',
  file_type: 'file',
};
expectType<{
  string_type: string;
  text_type: string;
  password_type: string;
  code_type: string;
  number_type: number;
  integer_type: number;
  boolean_type: boolean;
  datetime_type: string;
  file_type: string;
}>(typeComboResult);

//
// Test that copy fields are never appear in the bundle.
const copyComboInputs = [
  { key: 'copy_type', type: 'copy' },
  { key: 'copy_type_required', type: 'copy', required: true },
  { key: 'copy_type_not_required', type: 'copy', required: false },
] as const satisfies InputFields;
const copyComboResult: InferInputData<typeof copyComboInputs> = {};
expectType<{}>(copyComboResult);

//
// Test Field Functions' returned fields work.
// - The inner `as const satisfies InputField[]` is necessary to ensure
//   the return type is a constant array.
// - Even if the possible result fields are known, they will all be
//   considered optional.
const knownFieldFunctionInputs = [
  () =>
    [
      { key: 'ff_required', type: 'string', required: true },
      { key: 'ff_optional', type: 'string', required: false },
      { key: 'ff_omitted', type: 'string' },
    ] as const satisfies InputFields,
] as const satisfies InputFields;
const fieldFunctionResult: InferInputData<typeof knownFieldFunctionInputs> = {
  ff_required: 'a',
  ff_optional: 'b',
  ff_omitted: 'c',
};
expectType<{
  ff_required?: string; // Becomes optional.
  ff_optional?: string;
  ff_omitted?: string;
}>(fieldFunctionResult);

//
// Same but Async.
const knownFieldFunctionAsyncInputs = [
  async () =>
    [
      { key: 'ff_required', type: 'string', required: true },
      { key: 'ff_optional', type: 'string', required: false },
      { key: 'ff_omitted', type: 'string' },
    ] as const satisfies InputFields,
] as const satisfies InputFields;
const knownFieldFunctionAsyncResult: InferInputData<
  typeof knownFieldFunctionAsyncInputs
> = {
  ff_required: 'a',
  ff_optional: 'b',
  ff_omitted: 'c',
};
expectType<{
  ff_required?: string; // Becomes optional.
  ff_optional?: string;
  ff_omitted?: string;
}>(knownFieldFunctionAsyncResult);

//
// Test that all possible inputs a field function could return are
// combined into a flat object as optional fields.
const unionOfFunctionResultInputs = [
  () => {
    if (Math.random() > 0.5) {
      return [
        { key: 'ff_a', type: 'string', required: true },
      ] as const satisfies InputFields;
    }
    return [
      { key: 'ff_b', type: 'string', required: false },
    ] as const satisfies InputFields;
  },
] as const satisfies InputFields;
const unionOfFunctionResultInputsResult: InferInputData<
  typeof unionOfFunctionResultInputs
> = {
  ff_a: 'a',
  ff_b: 'b',
};
expectType<{
  ff_a?: string;
  ff_b?: string;
}>(unionOfFunctionResultInputsResult);

//
// Same but Async.
const unionOfFunctionResultAsyncInputs = [
  async (z, bundle) => {
    if (Math.random() > 0.5) {
      return [
        { key: 'ff_a', type: 'string', required: true },
      ] as const satisfies InputFields;
    }
    return [
      { key: 'ff_b', type: 'string', required: false },
    ] as const satisfies InputFields;
  },
] as const satisfies InputFields;
const unionOfFunctionResultAsyncResult: InferInputData<
  typeof unionOfFunctionResultAsyncInputs
> = {
  ff_a: 'a',
  ff_b: 'b',
};
expectType<{
  ff_a?: string; // Becomes optional.
  ff_b?: string;
}>(unionOfFunctionResultAsyncResult);

//
// Test that inputFieldFunctions with unknown fields results produce
// Record<string, unknown>.
const unknownFieldFunctionInputs = [
  () => {
    // E.g. Fetch fields from an API
    return [] as PlainInputField[];
  },
] as const satisfies InputFields;
const unknownFieldFunctionResult: InferInputData<
  typeof unknownFieldFunctionInputs
> = {};
expectType<Record<string, unknown>>(unknownFieldFunctionResult);

//
// Same but Async.
const unknownFieldFunctionAsyncInputs = [
  async () => {
    // E.g. Fetch fields from an API
    return [] as PlainInputField[];
  },
] as const satisfies InputFields;
const unknownFieldFunctionAsyncResult: InferInputData<
  typeof unknownFieldFunctionAsyncInputs
> = {};
expectType<Record<string, unknown>>(unknownFieldFunctionAsyncResult);

//
// Example of building up inputs, using them to inform dynamic field
// function inputs, and then testing the result of all of the inputs
// combined.

const basicFields = [
  { key: 'string_field', type: 'string', required: true },
  { key: 'number_field', type: 'number', required: true },
  { key: 'boolean_field', type: 'boolean', required: true },
  { key: 'optional_field', type: 'string', required: false },
  { key: 'omitted_field', type: 'string' },
] as const satisfies InputFields;

const dynamicField = ((z, bundle) => {
  expectType<{
    string_field: string;
    number_field: number;
    boolean_field: boolean;
    optional_field?: string;
    omitted_field?: string;
  }>(bundle.inputData);
  return [
    { key: 'dynamic_field', type: 'string', required: true },
  ] as const satisfies InputFields;
}) satisfies InputFieldFunctionWithInputs<typeof basicFields>;

const allFields = defineInputs([...basicFields, dynamicField]);

const allFieldsResult: InferInputData<typeof allFields> = {
  string_field: 'a',
  number_field: 1,
  boolean_field: true,
  optional_field: 'b',
  omitted_field: 'c',
  dynamic_field: 'd',
};
expectType<{
  string_field: string;
  number_field: number;
  boolean_field: boolean;
  optional_field?: string;
  omitted_field?: string;
  dynamic_field?: string; // Becomes optional.
}>(allFieldsResult);
