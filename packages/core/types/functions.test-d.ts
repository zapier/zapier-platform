import { expectAssignable, expectType } from 'tsd';
import type { PollingTriggerPerform, SearchPerform } from './functions';
import { Bundle, ZObject } from './custom';
import { InferInputData } from './inputs';
import { defineInputFields } from './typeHelpers';

const simplePerform = (async (z, bundle) => {
  return [{ id: '1', name: 'test' }];
}) satisfies PollingTriggerPerform;

expectAssignable<PollingTriggerPerform<{}, { id: string; name: string }>>(
  simplePerform,
);

const primaryKeyOverridePerform = (async (z, bundle) => {
  return [{ itemId: 123, name: 'test' }];
}) satisfies PollingTriggerPerform<{}, { itemId: number; name: string }>;

expectAssignable<PollingTriggerPerform<{}, { itemId: number; name: string }>>(
  primaryKeyOverridePerform,
);

//
// Automatic inputData inference
//
// Pass shape directly
const simplePerformWithInputFields = (async (z, bundle) => {
  return [{ id: '1', name: 'test' }];
}) satisfies PollingTriggerPerform<{ key: 'string' }>;
expectType<
  (
    z: ZObject,
    bundle: Bundle<{ key: 'string' }>,
  ) => Promise<{ id: string; name: string }[]>
>(simplePerformWithInputFields);

// Use InputFields and manually infer inputData
const inputFields = defineInputFields([
  { key: 'key1', type: 'string', required: true },
  { key: 'key2', type: 'number', required: false },
]);
const simplePerformWithInputFieldsAndManualInference = (async (z, bundle) => {
  return [{ id: '1', name: 'test' }];
}) satisfies PollingTriggerPerform<InferInputData<typeof inputFields>>;
expectType<
  (
    z: ZObject,
    bundle: Bundle<{ key1: string; key2?: number | undefined }>,
  ) => Promise<{ id: string; name: string }[]>
>(simplePerformWithInputFieldsAndManualInference);

// Use inputFields and automatically infer inputData
const simplePerformWithInputFieldsAndAutomaticInference = (async (
  z,
  bundle,
) => {
  return [{ id: '1', name: 'test' }];
}) satisfies PollingTriggerPerform<typeof inputFields>;
expectType<
  (
    z: ZObject,
    bundle: Bundle<{ key1: string; key2?: number | undefined }>,
  ) => Promise<{ id: string; name: string }[]>
>(simplePerformWithInputFieldsAndAutomaticInference);

//
// SearchResult<T> and SearchPerform tests
//

// Test SearchResult<T> with simple array return
const simpleSearchPerform = (async (z, bundle) => {
  return [{ id: '1', name: 'test' }];
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  simpleSearchPerform,
);

// Test SearchResult<T> with paginated object return
const paginatedSearchPerform = (async (z, bundle) => {
  return {
    results: [{ id: '1', name: 'test' }],
    paging_token: 'next-page-token',
  };
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  paginatedSearchPerform,
);

// Test SearchResult<T> with null paging_token
const nullPagingTokenSearchPerform = (async (z, bundle) => {
  return {
    results: [{ id: '1', name: 'test' }],
    paging_token: null,
  };
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  nullPagingTokenSearchPerform,
);

// Test SearchResult<T> with undefined paging_token
const undefinedPagingTokenSearchPerform = (async (z, bundle) => {
  return {
    results: [{ id: '1', name: 'test' }],
    paging_token: undefined,
  };
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  undefinedPagingTokenSearchPerform,
);

// Test SearchResult<T> with empty results array
const emptyResultsSearchPerform = (async (z, bundle) => {
  return {
    results: [],
    paging_token: 'next-page-token',
  };
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  emptyResultsSearchPerform,
);

// Test SearchResult<T> with empty array return
const emptyArraySearchPerform = (async (z, bundle) => {
  return [];
}) satisfies SearchPerform;

expectAssignable<SearchPerform<{}, { id: string; name: string }>>(
  emptyArraySearchPerform,
);
