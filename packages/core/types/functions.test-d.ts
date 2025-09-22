import { expectAssignable, expectType } from 'tsd';
import type { PollingTriggerPerform } from './functions';
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
