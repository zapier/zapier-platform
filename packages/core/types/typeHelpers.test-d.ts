import { defineApp, defineCreate, defineInputs } from './typeHelpers';

import { Bundle, ZObject } from './custom';
import { InferInputData } from './inputs';
import { expectType } from 'tsd';
import { BasicCreateOperation } from './schemas.generated';
import { CreatePerform } from './functions';

// #region Input Fields

const inputFields = defineInputs([
  { key: 'required_string', type: 'string', required: true },
  { key: 'optional_string', type: 'string', required: false },
  { key: 'required_number', type: 'number', required: true },
  { key: 'omitted_number', type: 'number' },
]);
type plainInputFieldsData = InferInputData<typeof inputFields>;

type plainInputFieldsExpected = {
  required_string: string;
  optional_string?: string | undefined;
  required_number: number;
  omitted_number?: number | undefined;
};
expectType<plainInputFieldsExpected>({} as plainInputFieldsData);

// #endregion

// #region Simple Create

const someCreate1 = defineCreate({
  key: 'someCreate1',
  noun: 'Some Noun',
  display: { label: 'Some Display' },
  operation: {
    inputFields,
    perform: async (z, bundle) => {
      expectType<Bundle<InferInputData<typeof inputFields>>>(bundle);
    },
  },
});

// #endregion

// #region Complex Create

const inputFields2 = defineInputs([
  { key: 'required_string', type: 'string', required: true },
  { key: 'optional_boolean', type: 'boolean', required: false },
  (z, bundle) => {
    if (bundle.inputData.optional_boolean) {
      return defineInputs([
        { key: 'extra_string', type: 'string', required: true },
        { key: 'extra_number', type: 'number', required: true },
      ]);
    }
    return [];
  },
]);
type inputFields2Data = InferInputData<typeof inputFields2>;

const perform = (async (z, bundle) => {
  if (bundle.inputData.optional_boolean) {
    return {
      extra_string: 'extra_string',
      extra_number: 1,
    };
  }
  return {};
}) satisfies CreatePerform<InferInputData<typeof inputFields2>>;

const someCreate2 = defineCreate({
  key: 'someCreate2',
  noun: 'Some Noun',
  display: { label: 'Some Display' },
  operation: {
    inputFields: inputFields2,
    perform,
  },
});
// #endregion

// #region App

const app = defineApp({
  version: '1.0.0',
  platformVersion: '1.0.0',
  creates: {
    [someCreate1.key]: someCreate1,
    [someCreate2.key]: someCreate2,
  },
});

app.creates[someCreate1.key].operation.perform;
app.creates[someCreate2.key].operation.perform;

// #endregion
