import { expectAssignable } from 'tsd';
import type { PollingTriggerPerform } from './functions';

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
