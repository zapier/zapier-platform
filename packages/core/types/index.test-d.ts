import type {
  AfterResponseMiddleware,
  App,
  Authentication,
  AuthenticationOAuth2Config,
  BasicCreateOperation,
  BasicDisplay,
  BasicHookOperation,
  BasicPollingOperation,
  BasicSearchOperation,
  BeforeRequestMiddleware,
  Bundle,
  Create,
  InputFields,
  Search,
  Trigger,
  ZObject,
} from '.';
import { expectAssignable, expectDeprecated, expectType } from 'tsd';
import { defineApp, defineCreate } from './typeHelpers';

const basicDisplay: BasicDisplay = {
  label: 'some-label',
  description: 'some-description',
  directions: 'some-directions',
  hidden: false,
};
expectType<BasicDisplay>(basicDisplay);

const oauth2Config: AuthenticationOAuth2Config = {
  authorizeUrl: {
    url: 'https://example.com/authorize',
  },
  getAccessToken: {
    url: 'https://example.com/token',
  },
  refreshAccessToken: async (z: ZObject, b: Bundle) => 'some-refresh-token',
};
expectType<AuthenticationOAuth2Config>(oauth2Config);

const authentication: Authentication = {
  type: 'oauth2',
  test: async (z: ZObject, b: Bundle) => ({ data: true }),
  oauth2Config,
};
expectType<Authentication>(authentication);

const inputFields = [
  { key: 'required_string', type: 'string', required: true },
  { key: 'optional_string', type: 'string', required: false },
  { key: 'required_number', type: 'number', required: true },
  { key: 'omitted_number', type: 'number' },
] as const satisfies InputFields;

const createOperation = {
  inputFields,
  perform: async (z, b) => ({ data: true }),
  sample: { id: 'some-id', name: 'some-name' },
} satisfies BasicCreateOperation<typeof inputFields>;
expectAssignable<BasicCreateOperation<typeof inputFields>>(createOperation);

const create = defineCreate({
  key: 'some_create_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some create label',
    description: 'some trigger description',
  },
  operation: createOperation,
});
expectAssignable<Create<'some_create_key_v1', typeof inputFields>>(create);

const pollingOperation = {
  type: 'polling',
  inputFields,
  perform: async (z, b) => [{ id: 'abc' }],
} as const satisfies BasicPollingOperation<typeof inputFields>;

type _ = ReturnType<typeof pollingOperation.perform>;
//   ^?

const pollingTrigger = {
  key: 'some_polling_trigger_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some polling trigger label',
    description: 'some polling trigger description',
  },
  operation: pollingOperation,
} as const satisfies Trigger<'some_polling_trigger_key_v1', typeof inputFields>;
expectAssignable<Trigger<'some_polling_trigger_key_v1', typeof inputFields>>(
  pollingTrigger,
);

const hookOperation = {
  type: 'hook',
  inputFields,
  perform: async (z, bundle) => [{ data: true }],
  performList: async (z, bundle) => [{ data: true }],
  performSubscribe: async (z, bundle) => ({ data: true }),
  performUnsubscribe: async (z, bundle) => ({ data: true }),
} satisfies BasicHookOperation<typeof inputFields>;
expectAssignable<BasicHookOperation<typeof inputFields>>(hookOperation);

const hookTrigger = {
  key: 'some_hook_trigger_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some hook label',
    description: 'some hook description',
  },
  operation: hookOperation,
} satisfies Trigger<'some_hook_trigger_key_v1', typeof inputFields>;
expectAssignable<Trigger<'some_hook_trigger_key_v1', typeof inputFields>>(
  hookTrigger,
);

const searchOperation = {
  inputFields,
  perform: async (z, bundle) => {
    z.request('https://example.com', { middlewareData: { resumable: true } });
    return [{ data: true }];
  },
} satisfies BasicSearchOperation<typeof inputFields>;
expectAssignable<BasicSearchOperation<typeof inputFields>>(searchOperation);

const search = {
  key: 'some_search_key_v1',
  noun: 'Some Noun',
  display: {
    label: 'some search label',
    description: 'some search description',
  },
  operation: searchOperation,
} as const satisfies Search<'some_search_key_v1', typeof inputFields>;
expectAssignable<Search<'some_search_key_v1', typeof inputFields>>(search);

const addBearerHeader: BeforeRequestMiddleware = (request, z, bundle) => {
  if (bundle?.authData?.access_token && !request.headers!.Authorization) {
    request.headers!.Authorization = `Bearer ${bundle.authData.access_token}`;
  }
  return request;
};
expectType<BeforeRequestMiddleware>(addBearerHeader);

const asyncBeforeRequest: BeforeRequestMiddleware = async (request) => {
  if (request.middlewareData?.resumable) {
    // do something async etc.
  }
  return request;
};
expectType<BeforeRequestMiddleware>(asyncBeforeRequest);

const checkPermissionsError: AfterResponseMiddleware = (response, z) => {
  if (response.status === 403) {
    throw new z.errors.Error(
      response.json?.['o:errorDetails']?.[0].detail,
      response.status.toString(),
    );
  }
  return response;
};
expectType<AfterResponseMiddleware>(checkPermissionsError);

const asyncAfterResponse: AfterResponseMiddleware = async (response) =>
  response;
expectType<AfterResponseMiddleware>(asyncAfterResponse);

const app = defineApp({
  platformVersion: '0.0.1',
  version: '0.0.1',

  beforeRequest: [addBearerHeader, asyncBeforeRequest],
  afterResponse: [checkPermissionsError, asyncAfterResponse],

  creates: { [create.key]: create },
});

expectAssignable<App<undefined, Record<string, Create>>>(app);

app.creates[create.key].operation.perform;
//                                  ^?

// Return types from z.request
async (z: ZObject) => {
  const resp = await z.request<{ id: number; name: string }>(
    'https://example.com',
  );
  expectType<{ id: number; name: string }>(resp.data);
  expectDeprecated(resp.json);
};

async (z: ZObject) => {
  const resp = await z.request<{ id: number; name: string }>({
    url: 'https://example.com',
  });
  expectType<{ id: number; name: string }>(resp.data);
};

// Return types from z.request (raw)
async (z: ZObject) => {
  const resp = await z.request<{ id: number; name: string }>(
    'https://example.com',
    { raw: true },
  );
  const result = await resp.json();
  expectType<{ id: number; name: string }>(result);
};
async (z: ZObject) => {
  const resp = await z.request<{ id: number; name: string }>({
    raw: true,
    url: 'https://example.com',
  });
  const result = await resp.json();
  expectType<{ id: number; name: string }>(result);
};
