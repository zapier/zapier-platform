import type {
  AfterResponseMiddleware,
  BeforeRequestMiddleware,
  Bundle,
  PerformFunction,
  ZObject,
} from './zapier.custom';
import type {
  App,
  Authentication,
  AuthenticationOAuth2Config,
  BasicActionOperation,
  BasicCreateActionOperation,
  BasicDisplay,
  BasicHookOperation,
  BasicPollingOperation,
  Create,
  Search,
  Trigger,
} from './zapier.generated';

import { expectType } from 'tsd';

const basicDisplay: BasicDisplay = {
  label: 'some-label',
  description: 'some-description',
  directions: 'some-directions',
  hidden: false,
};
expectType<BasicDisplay>(basicDisplay);

const oauth2Config: AuthenticationOAuth2Config = {
  authorizeUrl: 'https://example.com/authorize',
  getAccessToken: 'https://example.com/token',
  refreshAccessToken: async (z: ZObject, b: Bundle) => 'some-refresh-token',
};
expectType<AuthenticationOAuth2Config>(oauth2Config);

const authentication: Authentication = {
  type: 'oauth2',
  test: async (z: ZObject, b: Bundle) => ({ data: true }),
  oauth2Config,
};
expectType<Authentication>(authentication);

const createOperation: BasicCreateActionOperation = {
  inputFields: [{ key: 'some-input-key-1', type: 'string', required: true }],
  perform: async (z: ZObject, b: Bundle) => ({ data: true }),
  sample: { id: 'some-id', name: 'some-name' },
};
expectType<BasicCreateActionOperation>(createOperation);

const create: Create = {
  key: 'some_create_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some create label',
    description: 'some trigger description',
  },
  operation: createOperation,
};
expectType<Create>(create);

const pollingOperation: BasicPollingOperation = {
  type: 'polling',
  inputFields: [{ key: 'some-input-key-1', type: 'number', required: true }],
  perform: async (z: ZObject, b: Bundle) => ({ data: true }),
};

const pollingTrigger: Trigger = {
  key: 'some_polling_trigger_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some polling trigger label',
    description: 'some polling trigger description',
  },
  operation: pollingOperation,
};
expectType<Trigger>(pollingTrigger);

const hookOperation: BasicHookOperation = {
  type: 'hook',
  inputFields: [{ key: 'some-input-key-1', type: 'boolean', required: false }],
  perform: async (z: ZObject, b: Bundle) => ({ data: true }),
  performList: async (z: ZObject, b: Bundle) => [{ data: true }],
  performSubscribe: async (z: ZObject, b: Bundle) => ({ data: true }),
  performUnsubscribe: async (z: ZObject, b: Bundle) => ({ data: true }),
};
expectType<BasicHookOperation>(hookOperation);

const hookTrigger: Trigger = {
  key: 'some_hook_trigger_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some hook label',
    description: 'some hook description',
  },
  operation: hookOperation,
};
expectType<Trigger>(hookTrigger);

const searchOperation: BasicActionOperation = {
  inputFields: [{ key: 'some-input-key-1', type: 'file', required: true }],
  perform: async (z: ZObject, b: Bundle) => [{ data: true }],
};
expectType<BasicActionOperation>(searchOperation);

const search: Search = {
  key: 'some_search_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some search label',
    description: 'some search description',
  },
  operation: searchOperation,
};
expectType<Search>(search);

const addBearerHeader: BeforeRequestMiddleware = (request, z, bundle) => {
  if (bundle?.authData?.access_token && !request.headers!.Authorization) {
    request.headers!.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};
expectType<BeforeRequestMiddleware>(addBearerHeader);

const checkPermissionsError: AfterResponseMiddleware = (response, z) => {
  if (response.status === 403) {
    throw new z.errors.Error(
      response.json?.['o:errorDetails']?.[0].detail,
      response.status.toString()
    );
  }
  return response;
};
expectType<AfterResponseMiddleware>(checkPermissionsError);

const app: App = {
  platformVersion: '0.0.1',
  version: '0.0.1',

  beforeRequest: [addBearerHeader],
  afterResponse: [checkPermissionsError],

  creates: { [create.key]: create },
  triggers: {
    [pollingTrigger.key]: pollingTrigger,
    [hookTrigger.key]: hookTrigger,
  },
  searches: { [search.key]: search },
};
expectType<App>(app);
