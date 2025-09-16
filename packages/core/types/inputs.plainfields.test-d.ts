import { expectAssignable, expectType } from 'tsd';

import type { PlainFieldContribution } from './inputs';

//
// Parent fields (where `children` is set)
//

// Simplest `children: [{...}]` case.
const singleRequiredChild = {
  string_required: 'some_string',
};
type singleRequiredChildren = PlainFieldContribution<{
  key: 'parent_input';
  children: [{ key: 'string_required'; type: 'string'; required: true }];
}>;
expectType<singleRequiredChildren>(singleRequiredChild);

// Complete `children: [{...}]` case.
const multipleRequiredChild = {
  string_required: 'some_string',
  number_required: 1,
  boolean_required: true,
  datetime_required: '2021-01-01T00:00:00Z',
  file_required: 'some_file',
  password_required: 'some_password',
  code_required: 'some_code',
};
type multipleRequiredChildren = PlainFieldContribution<{
  key: 'parent_input';
  children: [
    { key: 'string_required'; type: 'string'; required: true },
    { key: 'number_required'; type: 'number'; required: true },
    { key: 'boolean_required'; type: 'boolean'; required: true },
    { key: 'datetime_required'; type: 'datetime'; required: true },
    { key: 'file_required'; type: 'file'; required: true },
    { key: 'password_required'; type: 'password'; required: true },
    { key: 'code_required'; type: 'code'; required: true },
  ];
}>;
expectType<multipleRequiredChildren>(multipleRequiredChild);

// Complete `children: [{...}]` case where all children are optional.
const multipleOptionalChild = {
  string_optional: 'some_string',
  number_optional: 1,
  boolean_optional: true,
  datetime_optional: '2021-01-01T00:00:00Z',
  file_optional: 'some_file',
  password_optional: 'some_password',
  code_optional: 'some_code',
};
type multipleOptionalChildren = PlainFieldContribution<{
  key: 'parent_input';
  children: [
    { key: 'string_optional'; type: 'string'; required: false },
    { key: 'number_optional'; type: 'number'; required: false },
    { key: 'boolean_optional'; type: 'boolean'; required: false },
    { key: 'datetime_optional'; type: 'datetime'; required: false },
    { key: 'file_optional'; type: 'file'; required: false },
    { key: 'password_optional'; type: 'password'; required: false },
    { key: 'code_optional'; type: 'code'; required: false },
  ];
}>;
expectAssignable<multipleOptionalChildren>(multipleOptionalChild);
expectAssignable<multipleOptionalChildren>({});

// Complete `children: [{...}]` case with complete mixture of required
// and optional fields.
const mixedOptionalChildren = {
  string_required: 'some_string',
  string_optional: 'some_string',
  number_required: 1,
  number_optional: 1,
  boolean_required: true,
  boolean_optional: true,
  datetime_required: '2021-01-01T00:00:00Z',
  datetime_optional: '2021-01-01T00:00:00Z',
  file_required: 'some_file',
  file_optional: 'some_file',
  password_required: 'some_password',
  password_optional: 'some_password',
  code_optional: 'some_code',
};
type mixedOptionalChildren = PlainFieldContribution<{
  key: 'parent_input';
  children: [
    { key: 'string_required'; type: 'string'; required: true },
    { key: 'string_optional'; type: 'string'; required: false },
  ];
}>;
expectAssignable<mixedOptionalChildren>(multipleRequiredChild);
expectAssignable<mixedOptionalChildren>({
  ...multipleRequiredChild,
  ...multipleOptionalChild,
});

//
// Dictionary fields (where `dict:true` is set)
//
// Required dictionary fields.
const expectedDictRequired = {
  dict_required: {
    some_string_1: 'some_string_1',
  } as Record<string, string>,
};
type dictRequiredResult = PlainFieldContribution<{
  key: 'dict_required';
  type: 'string';
  required: true;
  dict: true;
}>;
expectType<dictRequiredResult>(expectedDictRequired);

// Optional dictionary fields.
type dictOptionalResult = PlainFieldContribution<{
  key: 'dict_optional';
  type: 'string';
  dict: true;
}>;
expectAssignable<dictOptionalResult>({
  dict_optional: { a: 'aaa' },
});
expectAssignable<dictOptionalResult>({
  dict_optional: {} as Record<string, string>,
});
expectAssignable<dictOptionalResult>({
  dict_optional: {},
});
expectAssignable<dictOptionalResult>({ dict_optional: undefined });
expectAssignable<dictOptionalResult>({});

//
// List fields (where `list:true` is set)
//
// Required string list fields.
const expectedStringListRequired = {
  list_required_string: ['some_string_1', 'some_string_2'],
};
type stringListRequiredResult = PlainFieldContribution<{
  key: 'list_required_string';
  type: 'string';
  required: true;
  list: true;
}>;
expectType<stringListRequiredResult>(expectedStringListRequired);

// Optional string list fields.
type stringListOptionalResult = PlainFieldContribution<{
  key: 'list_optional_string';
  type: 'string';
  list: true;
}>;
expectAssignable<stringListOptionalResult>({
  list_optional_string: ['some_string_1', 'some_string_2'],
});
expectAssignable<stringListOptionalResult>({
  list_optional_string: [],
});
expectAssignable<stringListOptionalResult>({
  list_optional_string: undefined,
});
expectAssignable<stringListOptionalResult>({});

// Optional omitted type (string) list fields.
type omittedTypeListOptionalResult = PlainFieldContribution<{
  key: 'list_optional_omitted_type';
  // No `type` set.
  list: true;
}>;
expectAssignable<omittedTypeListOptionalResult>({
  list_optional_omitted_type: ['some_string_1', 'some_string_2'],
});
expectAssignable<omittedTypeListOptionalResult>({
  list_optional_omitted_type: [],
});
expectAssignable<omittedTypeListOptionalResult>({
  list_optional_omitted_type: undefined,
});
expectAssignable<omittedTypeListOptionalResult>({});

// Required integer list fields.
const expectedIntegerListRequired = {
  list_required_integer: [1, 2],
};
type integerListRequiredResult = PlainFieldContribution<{
  key: 'list_required_integer';
  type: 'integer';
  required: true;
  list: true;
}>;
expectType<integerListRequiredResult>(expectedIntegerListRequired);

// Optional integer list fields.
type integerListOptionalResult = PlainFieldContribution<{
  key: 'list_required';
  type: 'integer';
  list: true;
}>;
expectAssignable<integerListOptionalResult>({
  list_required: [1, 2],
});
expectAssignable<integerListOptionalResult>({
  list_required: [],
});
expectAssignable<integerListOptionalResult>({
  list_required: undefined,
});
expectAssignable<integerListOptionalResult>({});

//
// Primitive fields (no parent, dict, or list. Single input field.)
//
// Required primitive string field.
const expectedPrimitiveRequired = {
  primitive_required_string: 'some_string',
};
type primitiveRequiredStringResult = PlainFieldContribution<{
  key: 'primitive_required_string';
  type: 'string';
  required: true;
}>;
expectType<primitiveRequiredStringResult>(expectedPrimitiveRequired);

// Optional primitive string field.
type primitiveOptionalStringResult = PlainFieldContribution<{
  key: 'primitive_optional_string';
  type: 'string';
}>;
expectAssignable<primitiveOptionalStringResult>({
  primitive_optional_string: 'some_string',
});
expectAssignable<primitiveOptionalStringResult>({
  primitive_optional_string: undefined,
});
expectAssignable<primitiveOptionalStringResult>({});

// Required primitive integer field.
const expectedPrimitiveRequiredInteger = {
  primitive_required_integer: 1,
};
type primitiveRequiredIntegerResult = PlainFieldContribution<{
  key: 'primitive_required_integer';
  type: 'integer';
  required: true;
}>;
expectType<primitiveRequiredIntegerResult>(expectedPrimitiveRequiredInteger);

// Optional primitive integer field.
type primitiveOptionalIntegerResult = PlainFieldContribution<{
  key: 'primitive_optional_integer';
  type: 'integer';
}>;
expectAssignable<primitiveOptionalIntegerResult>({
  primitive_optional_integer: 1,
});
expectAssignable<primitiveOptionalIntegerResult>({
  primitive_optional_integer: undefined,
});
expectAssignable<primitiveOptionalIntegerResult>({});

// Required primitive number field.
const expectedPrimitiveRequiredNumber = {
  primitive_required_number: 1.1,
};
type primitiveRequiredNumberResult = PlainFieldContribution<{
  key: 'primitive_required_number';
  type: 'number';
  required: true;
}>;
expectType<primitiveRequiredNumberResult>(expectedPrimitiveRequiredNumber);

// Optional primitive number field.
type primitiveOptionalNumberResult = PlainFieldContribution<{
  key: 'primitive_optional_number';
  type: 'number';
}>;
expectAssignable<primitiveOptionalNumberResult>({
  primitive_optional_number: 1.1,
});
expectAssignable<primitiveOptionalNumberResult>({
  primitive_optional_number: undefined,
});
expectAssignable<primitiveOptionalNumberResult>({});

// Required primitive boolean field.
const expectedPrimitiveRequiredBoolean = {
  primitive_required_boolean: true,
};
type primitiveRequiredBooleanResult = PlainFieldContribution<{
  key: 'primitive_required_boolean';
  type: 'boolean';
  required: true;
}>;
expectType<primitiveRequiredBooleanResult>(expectedPrimitiveRequiredBoolean);

// Optional primitive boolean field.
type primitiveOptionalBooleanResult = PlainFieldContribution<{
  key: 'primitive_optional_boolean';
  type: 'boolean';
}>;
expectAssignable<primitiveOptionalBooleanResult>({
  primitive_optional_boolean: true,
});
expectAssignable<primitiveOptionalBooleanResult>({
  primitive_optional_boolean: undefined,
});
expectAssignable<primitiveOptionalBooleanResult>({});

// Required primitive datetime field.
const expectedPrimitiveRequiredDatetime = {
  primitive_required_datetime: '2021-01-01T00:00:00Z',
};

type primitiveRequiredDatetimeResult = PlainFieldContribution<{
  key: 'primitive_required_datetime';
  type: 'datetime';
  required: true;
}>;
expectType<primitiveRequiredDatetimeResult>(expectedPrimitiveRequiredDatetime);

// Optional primitive datetime field.
type primitiveOptionalDatetimeResult = PlainFieldContribution<{
  key: 'primitive_optional_datetime';
  type: 'datetime';
}>;
expectAssignable<primitiveOptionalDatetimeResult>({
  primitive_optional_datetime: '2021-01-01T00:00:00Z',
});
expectAssignable<primitiveOptionalDatetimeResult>({
  primitive_optional_datetime: undefined,
});
expectAssignable<primitiveOptionalDatetimeResult>({});

// Optional primitive copy field.
type primitiveOptionalCopyResult = PlainFieldContribution<{
  key: 'primitive_optional_copy';
  type: 'copy';
}>;
expectAssignable<primitiveOptionalCopyResult>({
  primitive_optional_copy: undefined,
});
expectAssignable<primitiveOptionalCopyResult>({});
