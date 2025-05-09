import {
  defineApp,
  defineCreate,
  defineInputFields,
  defineSearch,
  defineTrigger,
} from './typeHelpers';

import { InferInputData, InputFields } from './inputs';
import { expectType } from 'tsd';
import { Trigger } from './schemas.generated';
import { CreatePerform, PollingTriggerPerform } from './functions';
import { Bundle } from './custom';

// #region Input Fields
// ====================

const plainInputFields = defineInputFields([
  { key: 'required_string', type: 'string', required: true },
  { key: 'optional_string', type: 'string', required: false },
  { key: 'required_number', type: 'number', required: true },
  { key: 'omitted_number', type: 'number' },
]);
type plainInputFieldsData = InferInputData<typeof plainInputFields>;

type plainInputFieldsExpected = {
  required_string: string;
  optional_string?: string | undefined;
  required_number: number;
  omitted_number?: number | undefined;
};
expectType<plainInputFieldsExpected>({} as plainInputFieldsData);

// #endregion

// #region Create Examples
// ==============================

const basicCreate = defineCreate({
  key: 'basicCreate',
  noun: 'Create Basic Noun',
  display: {
    label: 'Create Basic Display',
    description: 'Create action, defined entirely in one defineCreate call',
  },
  operation: {
    inputFields: plainInputFields,
    perform: async (z, bundle) => {
      expectType<Bundle<InferInputData<typeof plainInputFields>>>(bundle);
    },
  },
});

// "Expanded" create is defined with separate Inputs, Perform, and only
// then a `defineCreate` call.

const expandedCreateInputFields = defineInputFields([
  { key: 'string2', type: 'string', required: true },
  { key: 'boolean2', type: 'boolean', required: false },
  (z, bundle) => {
    if (bundle.inputData.boolean2) {
      return defineInputFields([
        { key: 'extra_string2', type: 'string', required: true },
        { key: 'extra_number2', type: 'number', required: true },
      ]);
    }
    return [];
  },
]);

const expandedCreatePerform = (async (z, bundle) => {
  if (bundle.inputData.boolean2) {
    return {
      extra_string: 'extra_string',
      extra_number: 1,
    };
  }
  return {};
}) satisfies CreatePerform<InferInputData<typeof expandedCreateInputFields>>;

const expandedCreate = defineCreate({
  key: 'expandedCreate',
  noun: 'Expanded Create Noun',
  display: { label: 'Expanded Create Display' },
  operation: {
    inputFields: expandedCreateInputFields,
    perform: expandedCreatePerform,
  },
});

// #endregion

// #region Trigger Examples
// ========================

// Simplest trigger defined within one `defineTrigger` call.
const basicTrigger = defineTrigger({
  key: 'basicTrigger',
  noun: 'Basic Trigger Noun',
  display: { label: 'Basic Trigger Display' },
  operation: {
    type: 'polling',
    inputFields: plainInputFields,
    perform: async (z, bundle) => {
      return [{ id: 'abc' }];
    },
  },
});

// "Raw" Trigger uses only raw types and uses no `define` functions,
// (showing why `define` functions are better).
const rawInputFields = [
  { key: 'rawTriggerString', type: 'string', required: true },
  { key: 'rawTriggerNumber', type: 'number', required: true },
  { key: 'rawTriggerBoolean', type: 'boolean', required: true },
  (z, bundle) => {
    if (bundle.inputData.rawTriggerBoolean) {
      return [
        { key: 'rawTriggerString2', type: 'string', required: true },
        { key: 'rawTriggerNumber2', type: 'number', required: true },
      ] as const satisfies InputFields;
    }
    return [] as const satisfies InputFields;
  },
] as const satisfies InputFields;

const rawTriggerPerform = (async (z, bundle) => {
  return [{ id: 'abc' }];
}) satisfies PollingTriggerPerform<InferInputData<typeof rawInputFields>>;

const rawTrigger: Trigger<'rawTrigger', typeof rawInputFields> = {
  key: 'rawTrigger',
  noun: 'Raw Noun',
  display: {
    label: 'Raw Trigger',
    description:
      'Raw trigger, defined using raw types and no `define` functions.',
  },
  operation: {
    type: 'polling',
    inputFields: rawInputFields,
    perform: rawTriggerPerform,
  },
};

// Expanded Trigger uses `defineTrigger` with separate Inputs, Perform,
// and only then a `defineTrigger` call.

const expandedTriggerInputFields = defineInputFields([
  { key: 'expandedTriggerString', type: 'string', required: true },
  { key: 'expandedTriggerBoolean', type: 'boolean', required: false },
  (z, bundle) => {
    if (bundle.inputData.expandedTriggerBoolean) {
      return defineInputFields([
        { key: 'dynamicTriggerString', type: 'string', required: true },
        { key: 'dynamicTriggerNumber', type: 'number', required: true },
      ]);
    }
    return [];
  },
]);

const expandedTriggerPerform = (async (z, bundle) => {
  return [{ id: 'abc' }];
}) satisfies PollingTriggerPerform<
  InferInputData<typeof expandedTriggerInputFields>
>;

const expandedTrigger = defineTrigger({
  key: 'expandedTrigger',
  noun: 'Expanded Trigger Noun',
  display: { label: 'Expanded Trigger Display' },
  operation: {
    type: 'polling',
    inputFields: expandedTriggerInputFields,
    perform: expandedTriggerPerform,
  },
});

// #endregion

// region Search Examples

const basicSearch = defineSearch({
  key: 'basicSearch',
  noun: 'Basic Search Noun',
  display: { label: 'Basic Search Display' },
  operation: {
    inputFields: plainInputFields,
    perform: async (z, bundle) => {
      return [{ id: 'abc' }];
    },
  },
});

// #endregion

// #region App
// ===========

const app = defineApp({
  version: '1.0.0',
  platformVersion: '1.0.0',
  creates: {
    [basicCreate.key]: basicCreate,
    [expandedCreate.key]: expandedCreate,
  },
  searches: {
    [basicSearch.key]: basicSearch,
  },
  triggers: {
    [basicTrigger.key]: basicTrigger,
    [rawTrigger.key]: rawTrigger,
    [expandedTrigger.key]: expandedTrigger,
  },
});

// #endregion
