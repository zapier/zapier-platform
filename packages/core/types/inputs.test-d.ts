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
  StringHints,
} from './inputs';
import { defineInputFields } from '.';
import type { PlainInputField } from './schemas.generated';

import { expectAssignable, expectType } from 'tsd';

//
// Test for when `type` is not set, the field defaults to `string`.
const defaultStringInputs = defineInputFields([{ key: 'default_string' }]);
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
const requiredComboInputs = defineInputFields([
  { key: 'required_true', required: true },
  { key: 'required_false', required: false },
  { key: 'required_omitted' }, // Will also be optional.
]);

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
const typeComboInputs = defineInputFields([
  { key: 'string_type', type: 'string', required: true },
  { key: 'text_type', type: 'text', required: true },
  { key: 'password_type', type: 'password', required: true },
  { key: 'code_type', type: 'code', required: true },
  { key: 'number_type', type: 'number', required: true },
  { key: 'integer_type', type: 'integer', required: true },
  { key: 'boolean_type', type: 'boolean', required: true },
  { key: 'datetime_type', type: 'datetime', required: true },
  { key: 'file_type', type: 'file', required: true },
]);
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
const copyComboInputs = defineInputFields([
  { key: 'copy_type', type: 'copy' },
  { key: 'copy_type_required', type: 'copy', required: true },
  { key: 'copy_type_not_required', type: 'copy', required: false },
]);
const copyComboResult: InferInputData<typeof copyComboInputs> = {};
expectType<{}>(copyComboResult);

//
// Test Field Functions' returned fields work.
// - The inner `as const satisfies InputField[]` is necessary to ensure
//   the return type is a constant array.
// - Even if the possible result fields are known, they will all be
//   considered optional.
const knownFieldFunctionInputs = defineInputFields([
  () =>
    defineInputFields([
      { key: 'ff_required', type: 'string', required: true },
      { key: 'ff_optional', type: 'string', required: false },
      { key: 'ff_omitted', type: 'string' },
    ]),
]);
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
const knownFieldFunctionAsyncInputs = defineInputFields([
  async () =>
    defineInputFields([
      { key: 'ff_required', type: 'string', required: true },
      { key: 'ff_optional', type: 'string', required: false },
      { key: 'ff_omitted', type: 'string' },
    ]),
]);
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
const unionOfFunctionResultInputs = defineInputFields([
  () => {
    if (Math.random() > 0.5) {
      return defineInputFields([
        { key: 'ff_a', type: 'string', required: true },
      ]);
    }
    return defineInputFields([
      { key: 'ff_b', type: 'string', required: false },
    ]);
  },
]);
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
const unionOfFunctionResultAsyncInputs = defineInputFields([
  async (z, bundle) => {
    if (Math.random() > 0.5) {
      return defineInputFields([
        { key: 'ff_a', type: 'string', required: true },
      ]);
    }
    return defineInputFields([
      { key: 'ff_b', type: 'string', required: false },
    ]);
  },
]);
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
const unknownFieldFunctionInputs = defineInputFields([
  () => {
    // E.g. Fetch fields from an API
    return [];
  },
]);
const unknownFieldFunctionResult: InferInputData<
  typeof unknownFieldFunctionInputs
> = {};
expectType<Record<string, unknown>>(unknownFieldFunctionResult);

//
// Same but Async.
const unknownFieldFunctionAsyncInputs = defineInputFields([
  async () => {
    // E.g. Fetch fields from an API
    return [] as PlainInputField[];
  },
]);
const unknownFieldFunctionAsyncResult: InferInputData<
  typeof unknownFieldFunctionAsyncInputs
> = {};
expectType<Record<string, unknown>>(unknownFieldFunctionAsyncResult);

//
// Example of building up inputs, using them to inform dynamic field
// function inputs, and then testing the result of all of the inputs
// combined.

const basicFields = defineInputFields([
  { key: 'string_field', type: 'string', required: true },
  { key: 'number_field', type: 'number', required: true },
  { key: 'boolean_field', type: 'boolean', required: true },
  { key: 'optional_field', type: 'string', required: false },
  { key: 'omitted_field', type: 'string' },
]);

const dynamicField = ((z, bundle) => {
  expectType<{
    string_field: string;
    number_field: number;
    boolean_field: boolean;
    optional_field?: string;
    omitted_field?: string;
  }>(bundle.inputData);
  return defineInputFields([
    { key: 'dynamic_field', type: 'string', required: true },
  ]);
}) satisfies InputFieldFunctionWithInputs<typeof basicFields>;

const allFields = defineInputFields([...basicFields, dynamicField]);

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

// Choices
const choicesInputs = defineInputFields([
  {
    key: 'choices_string_array',
    type: 'string',
    required: true,
    choices: ['c1', 'c2'],
  },
  {
    key: 'choices_object',
    type: 'string',
    required: true,
    choices: { c3: 'C3', c4: 'C4' },
  },
  {
    key: 'choices_field_array',
    type: 'string',
    required: true,
    choices: [
      { label: 'C5', value: 'c5', sample: 'c5' },
      { label: 'C6', value: 'c6', sample: 'c6' },
    ],
  },
  {
    key: 'choices_list',
    type: 'string',
    required: true,
    list: true,
    choices: ['c7', 'c8'],
  },
  {
    key: 'ignored_parent',
    children: [
      {
        key: 'child_choice',
        type: 'string',
        required: true,
        choices: { c9: 'C9', c10: 'C10' },
      },
      {
        key: 'child_choice_list',
        type: 'string',
        required: true,
        list: true,
        choices: ['c11', 'c12'],
      },
    ],
  },
]);
const choicesResult: InferInputData<typeof choicesInputs> = {
  choices_string_array: 'c1',
  choices_object: 'c3',
  choices_field_array: 'c5',
  choices_list: ['c7'],
  child_choice: 'c9',
  child_choice_list: ['c11'],
};
expectType<{
  choices_string_array: StringHints<'c1' | 'c2'>;
  choices_object: StringHints<'c3' | 'c4'>;
  choices_field_array: StringHints<'c5' | 'c6'>;
  choices_list: StringHints<'c7' | 'c8'>[];
  child_choice: StringHints<'c9' | 'c10'>;
  child_choice_list: StringHints<'c11' | 'c12'>[];
  ignored_parent?: Array<{
    child_choice: StringHints<'c9' | 'c10'>;
    child_choice_list: StringHints<'c11' | 'c12'>[];
  }>;
}>(choicesResult);
