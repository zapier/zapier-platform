'use strict';

// an example app!

const https = require('https');

const _ = require('lodash');
const helpers = require('./helpers');
const { HTTPBIN_URL } = require('../constants');

process.env.BASE_URL = HTTPBIN_URL;

const List = {
  key: 'list',
  noun: 'List',
  list: {
    display: {
      description: 'Trigger on new thing in list.',
      label: 'List',
    },
    operation: {
      perform: (z, bundle) => {
        return helpers.noop([{ id: 1234 }, { id: 5678 }]);
      },
    },
  },
};

const ListRequire = {
  key: 'listrequire',
  noun: 'List',
  list: {
    display: {
      description: 'Trigger on new thing in list.',
      label: 'List',
    },
    operation: {
      perform: (z, bundle) => {
        // in prod, process.cwd will return the app root directory
        const { BASE_URL } = z.require('./test/userapp/constants.js');
        return [{ id: 1, url: BASE_URL }];
      },
    },
  },
};

const Contact = {
  key: 'contact',
  noun: 'Contact',
  list: {
    display: {
      label: 'New Contact',
      description: 'Trigger on new contacts.',
    },
    operation: {
      perform: async (z, bundle) => {
        const response = await z.request({
          url: `${process.env.BASE_URL}/get`,
        });
        return [{ id: 'dontcare', ...response.data }];
      },
      inputFields: [
        {
          key: 'list_id',
          type: 'integer',
          dynamic: List.key,
          required: false,
        },
      ],
      outputFields: [
        {
          key: 'list_id',
          type: 'integer',
          dynamic: List.key,
          required: false,
        },
      ], // or function
    },
  },
  create: {
    display: {
      label: 'Create Contact',
      description: 'Create a contact.',
    },
    operation: {
      perform: () => {},
    },
  },
  outputFields: [{ key: 'id', type: 'string' }, () => {}], // or function
};

const ContactError = {
  key: 'contacterror',
  noun: 'Contact Error',
  list: {
    display: {
      label: 'New Contact With Error!',
      description: 'Trigger on new contacts, but return an error in response.',
    },
    operation: {
      perform: {
        url: '{{process.env.BASE_URL}}/get?error=serverDown',
      },
    },
  },
};

const ContactSource = {
  key: 'contactsource',
  noun: 'Contact Source',
  list: {
    display: {
      label: 'New Contact With Source!',
      description:
        'Trigger on new contacts, but return a response via fake JS source.',
    },
    operation: {
      perform: {
        source: 'return [{ id: 1234 }];',
      },
    },
  },
};

const LoggingFunc = {
  key: 'loggingfunc',
  noun: 'loggingfunc',
  list: {
    display: {
      label: 'New Logging Func',
      description: 'Just works on sync function.',
    },
    operation: {
      perform: (z /* , bundle */) => {
        const results = [{ id: 1234 }];
        z.console.log('operation results: %j', results); // just showing that formatting works
        z.console.error('something bad happened');
        z.console.trace(new Error('sky is falling'));
        return [{ id: 1234 }];
      },
    },
  },
};

const RequestSugar = {
  key: 'requestsugar',
  noun: 'requestsugar',
  list: {
    display: {
      label: 'New Request Func',
      description: 'Makes an http request via z.request with single url param.',
    },
    operation: {
      perform: (z /* , bundle */) => {
        return z.request(`${HTTPBIN_URL}/get`).then((resp) => {
          return [{ id: 'dontcare', ...resp.data }];
        });
      },
    },
  },
};

const WorkingFunc = {
  key: 'workingfunc',
  noun: 'workingfunc',
  list: {
    display: {
      label: 'New Working Func',
      description: 'Just works on sync function.',
    },
    operation: {
      perform: (/* z, bundle */) => {
        return [{ id: 1234 }];
      },
    },
  },
};

const WorkingFuncAsync = {
  key: 'workingfuncasync',
  noun: 'workingfuncasync',
  list: {
    display: {
      label: 'New Working Async Func',
      description: 'Just works on an async function.',
    },
    operation: {
      perform: (z, bundle, cb) => {
        return cb(null, [{ id: 2345 }]);
      },
    },
  },
};

const WorkingFuncPromise = {
  key: 'workingfuncpromise',
  noun: 'workingfuncpromise',
  list: {
    display: {
      label: 'New Working Promise',
      description: 'Just works on an promise.',
    },
    operation: {
      perform: () => {
        return Promise.resolve([{ id: 3456 }]);
      },
    },
  },
};

const FailerHttp = {
  key: 'failerhttp',
  noun: 'failerhttp',
  list: {
    display: {
      label: 'New Failer',
      description: 'Just fails on HTTP.',
    },
    operation: {
      perform: {
        url: `${HTTPBIN_URL}/status/403`,
      },
    },
  },
};

const FailerFunc = {
  key: 'failerfunc',
  noun: 'failerfunc',
  list: {
    display: {
      label: 'New Failer Func',
      description: 'Just fails on sync function.',
    },
    operation: {
      perform: (/* z, bundle */) => {
        throw new Error('Failer on sync function!');
      },
    },
  },
};

const FailerFuncAsync = {
  key: 'failerfuncasync',
  noun: 'failerfuncasync',
  list: {
    display: {
      label: 'New Failer Func Async',
      description: 'Just fails on async function.',
    },
    operation: {
      /* eslint no-unused-vars: 0 */
      perform: (z, bundle, cb) => {
        setTimeout(() => {
          throw new Error('Failer on async function!');
        }, 0);
      },
    },
  },
};

const FailerFuncPromise = {
  key: 'failerfuncpromise',
  noun: 'failerfuncpromise',
  list: {
    display: {
      label: 'New Failer Promise',
      description: 'Just fails on an promise.',
    },
    operation: {
      perform: () => {
        return Promise.reject(new Error('Failer on promise function!'));
      },
    },
  },
};

const StaticInputFields = {
  key: 'staticinputfields',
  noun: 'staticinputfields',
  list: {
    display: {
      label: 'Static Input Fields',
      description: 'has static input fields',
    },
    operation: {
      inputFields: [{ key: 'key 1' }, { key: 'key 2' }, { key: 'key 3' }],
      outputFields: [{ key: 'key 1' }, { key: 'key 2' }, { key: 'key 3' }],
      perform: () => {},
    },
  },
};

const DynamicSyncInputFields = {
  key: 'dynamicsyncinputfields',
  noun: 'dynamicsyncinputfields',
  list: {
    display: {
      label: 'Dynamic Sync Fields',
      description: 'sync function input fields',
    },
    operation: {
      inputFields: [
        (z, bundle) => [
          { key: bundle.key1 },
          { key: bundle.key2 },
          { key: bundle.key3 },
        ],
      ],
      outputFields: [
        (z, bundle) => [
          { key: bundle.key1 },
          { key: bundle.key2 },
          { key: bundle.key3 },
        ],
      ],
      perform: () => {},
    },
  },
};

const DynamicAsyncInputFields = {
  key: 'dynamicasyncinputfields',
  noun: 'dynamicasyncinputfields',
  list: {
    display: {
      label: 'Dynamic Async Fields',
      description: 'input fields are a promise',
    },
    operation: {
      inputFields: [
        function (z, bundle) {
          return Promise.resolve([
            { key: 'key 1' },
            { key: 'key 2' },
            { key: 'key 3' },
          ]);
        },
      ],
      outputFields: [
        function (z, bundle) {
          return Promise.resolve([
            { key: 'key 1' },
            { key: 'key 2' },
            { key: 'key 3' },
          ]);
        },
      ],
      perform: () => {},
    },
  },
};

const MixedInputFields = {
  key: 'mixedinputfields',
  noun: 'mixedinputfields',
  list: {
    display: {
      label: 'Mixed Input Fields',
      description:
        'input fields are static, a sync function, and an async promise',
    },
    operation: {
      inputFields: [
        { key: 'key 1' },
        (z, bundle) => Promise.resolve({ key: bundle.key2 }),
        (z, bundle) => Promise.resolve({ key: 'key 3' }),
      ],
      outputFields: [
        { key: 'key 1' },
        (z, bundle) => Promise.resolve({ key: bundle.key2 }),
        (z, bundle) => Promise.resolve({ key: 'key 3' }),
      ],
      perform: () => {},
    },
  },
};

const CachedCustomInputFields = {
  key: 'cachedcustominputfields',
  noun: 'cachedcustominputfields',
  list: {
    display: {
      label: 'Cached Custom Input Fields',
      description: 'Get/Set custom input fields in zcache',
    },
    operation: {
      inputFields: [helpers.getCustomFields],
      perform: () => {},
    },
  },
};

const HonkerDonker = {
  key: 'honkerdonker',
  noun: 'honkerdonker',
  get: {
    display: {
      label: 'Get a big honking object',
      description: 'This will be dehydrated by list',
    },
    operation: {
      perform: (z, bundle) => {
        return {
          message: `honker donker number ${bundle.honkerId}`,
        };
      },
    },
  },
  list: {
    display: {
      label: 'Trigger on New Thing in List',
      description: 'Will include dehydrated data',
    },
    operation: {
      perform: (z, bundle) => {
        const honkerIds = [1, 2, 3];
        return honkerIds.map((id) => {
          return {
            id,
            $HOIST$: z.dehydrate(HonkerDonker.get.operation.perform, {
              honkerId: id,
            }),
          };
        });
      },
    },
  },
};

const ExecuteRequestAsFunc = {
  key: 'executeRequestAsFunc',
  noun: 'Request',
  list: {
    display: {
      label: 'Configurable Request (Func)',
      description: 'Used for one-offs in the tests.',
    },
    operation: {
      perform: (z, bundle) => {
        const req = _.defaults({}, bundle.inputData.options);
        return z.request(req).then((resp) => {
          return bundle.inputData.returnValue || resp.data;
        });
      },
      inputFields: [
        { key: 'options', dict: true },
        { key: 'returnValue', list: true },
      ],
    },
  },
};

const ExecuteRequestAsShorthand = {
  key: 'executeRequestAsShorthand',
  noun: 'Request',
  list: {
    display: {
      label: 'Configurable Request (Shorthand)',
      description: 'Used for one-offs in the tests.',
    },
    operation: {
      perform: {
        url: '{{bundle.inputData.url}}',
      },
      inputFields: [
        {
          key: 'url',
          default: `${HTTPBIN_URL}/status/403`,
        },
      ],
    },
  },
  create: {
    display: {
      label: 'Configurable Request (Shorthand)',
      description: 'Used for one-offs in the tests.',
    },
    operation: {
      perform: {
        url: '{{bundle.inputData.url}}',
      },
      inputFields: [
        {
          key: 'url',
          default: `${HTTPBIN_URL}/status/403`,
        },
      ],
    },
  },
};
const EnvironmentVariable = {
  key: 'env',
  noun: 'Environment Variable',
  list: {
    display: {
      label: 'New Environment Variable',
      description: 'Trigger on new environment variables.',
    },
    operation: {
      perform: (z, bundle) => {
        const results = [];
        _.each(process.env || {}, (value, key) => {
          if (key.startsWith('_ZAPIER_')) {
            results.push({ key, value });
          }
        });
        return results;
      },
    },
  },
};
const ExecuteCallbackRequest = {
  key: 'executeCallbackRequest',
  noun: 'Callback',
  create: {
    display: {
      label: 'Callback Usage in a perform',
      description: 'Used for one-offs in the tests.',
    },
    operation: {
      perform: (z) => {
        // we need to access the callback url
        const callbackUrl = z.generateCallbackUrl();
        return { id: 'dontcare', callbackUrl };
      },
      performResume: (z, bundle) => {
        return Object.assign({}, bundle.outputData, bundle.cleanedRequest);
      },
      inputFields: [
        {
          key: 'test',
          default: 'Manual Value',
        },
      ],
    },
  },
};

const BadCallback = {
  key: 'bad_callback',
  noun: 'Bad Callback',
  create: {
    display: {
      label: 'Bad callback still running even after Lambda handler returns',
      description:
        'This is actually bad code because all the callbacks/promises should be ' +
        'finished BEFORE the Lambda handler returns. We test it here because we ' +
        'do not want a bad app implementation to hang the Lambda handler.',
    },
    operation: {
      perform: (z, bundle) => {
        https
          .request(`${HTTPBIN_URL}/status/418`, (res) => {
            let body = '';
            res.on('data', (d) => {
              body += d;
            });
            res.on('end', () => {
              // Set a global variable so we have something to assert in the test
              // to prove we can reach here
              process.teapot = body;
              // body === "I'm a teapot!"
            });
          })
          .end();
        return { message: 'ok' };
      },
    },
  },
};

const createLargeResponse = (targetSizeInMB) => {
  const targetSize = targetSizeInMB * 1024 * 1024; // Convert MB to bytes
  const sampleData = {
    id: 1,
    data: 'a'.repeat(targetSize),
  };
  return sampleData;
};

// 10mb of data
const ReallyBigResponse = {
  key: 'really_big_response',
  noun: 'Really Big Response',
  list: {
    display: {
      label: 'Really Big Response',
      description: 'This is a really big response.',
    },
    operation: {
      perform: (z, bundle) => {
        return createLargeResponse(10);
      },
    },
  },
};

// custom HTTP middlewares /////

/*
  Before HTTP middleware that adds a customer header before every request.
 */
const addRequestHeader = (request, z, bundle) => {
  request.headers['X-Hashy'] = z.hash('md5', 'One Cool Dev');
  request.headers['X-Author'] = 'One Cool Dev';
  return request;
};

const App = {
  beforeRequest: [addRequestHeader],
  afterResponse: [],
  resources: {
    [List.key]: List,
    [ListRequire.key]: ListRequire,
    [Contact.key]: Contact,
    [ContactError.key]: ContactError,
    [ContactSource.key]: ContactSource,
    [LoggingFunc.key]: LoggingFunc,
    [RequestSugar.key]: RequestSugar,
    [WorkingFunc.key]: WorkingFunc,
    [WorkingFuncAsync.key]: WorkingFuncAsync,
    [WorkingFuncPromise.key]: WorkingFuncPromise,
    [FailerHttp.key]: FailerHttp,
    [FailerFunc.key]: FailerFunc,
    [FailerFuncAsync.key]: FailerFuncAsync,
    [FailerFuncPromise.key]: FailerFuncPromise,
    [StaticInputFields.key]: StaticInputFields,
    [DynamicSyncInputFields.key]: DynamicSyncInputFields,
    [DynamicAsyncInputFields.key]: DynamicAsyncInputFields,
    [MixedInputFields.key]: MixedInputFields,
    [CachedCustomInputFields.key]: CachedCustomInputFields,
    [HonkerDonker.key]: HonkerDonker,
    [ExecuteRequestAsFunc.key]: ExecuteRequestAsFunc,
    [ExecuteRequestAsShorthand.key]: ExecuteRequestAsShorthand,
    [ExecuteCallbackRequest.key]: ExecuteCallbackRequest,
    [EnvironmentVariable.key]: EnvironmentVariable,
    [BadCallback.key]: BadCallback,
    [ReallyBigResponse.key]: ReallyBigResponse,
  },
  hydrators: {
    getBigStuff: () => {},
  },
  version: '1.0.0',
  platformVersion: '7.2.0',
};

module.exports = App;
