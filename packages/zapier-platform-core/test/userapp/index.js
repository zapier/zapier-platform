// an example app!

process.env.BASE_URL = 'http://zapier-httpbin.herokuapp.com';

const _ = require('lodash');
const helpers = require('./helpers');

const List = {
  key: 'list',
  noun: 'List',
  list: {
    display: {
      description: 'Trigger on new thing in list.'
    },
    operation: {
      perform: (z, bundle) => {
        return helpers.noop([{ id: 1234 }, { id: 5678 }]);
      }
    }
  }
};

const Contact = {
  key: 'contact',
  noun: 'Contact',
  list: {
    display: {
      label: 'New Contact',
      description: 'Trigger on new contacts.',
      visible: true
    },
    operation: {
      perform: {
        url: '{{process.env.BASE_URL}}/get'
      },
      inputFields: [
        {
          key: 'list_id',
          type: 'integer',
          dynamic: List.key,
          required: false
        }
      ],
      outputFields: [
        {
          key: 'list_id',
          type: 'integer',
          dynamic: List.key,
          required: false
        }
      ] // or function
    }
  },
  create: {
    display: {
      label: 'Create Contact'
    },
    operation: {
      perform: () => {}
    }
  },
  outputFields: [{ key: 'id', type: 'string' }, () => {}] // or function
};

const ContactError = {
  key: 'contacterror',
  noun: 'Contact Error',
  list: {
    display: {
      label: 'New Contact With Error!',
      description: 'Trigger on new contacts, but return an error in response.'
    },
    operation: {
      perform: {
        url: '{{process.env.BASE_URL}}/get?error=serverDown'
      }
    }
  }
};

const LoggingFunc = {
  key: 'loggingfunc',
  noun: 'loggingfunc',
  list: {
    display: {
      label: 'New Logging Func',
      description: 'Just works on sync function.'
    },
    operation: {
      perform: (z /* , bundle */) => {
        const results = [{ id: 1234 }];
        z.console.log('operation results: %j', results); // just showing that formatting works
        z.console.error('something bad happened');
        z.console.trace(new Error('sky is falling'));
        return [{ id: 1234 }];
      }
    }
  }
};

const RequestFunc = {
  key: 'requestfunc',
  noun: 'requestfunc',
  list: {
    display: {
      label: 'New Request Func',
      description: 'Makes an http request via z.request.'
    },
    operation: {
      perform: (z /* , bundle */) => {
        return z.request({ url: '{{process.env.BASE_URL}}/get' }).then(resp => {
          const result = JSON.parse(resp.content);
          result.id = 123;
          return [result];
        });
      }
    }
  }
};

const RequestSugar = {
  key: 'requestsugar',
  noun: 'requestsugar',
  list: {
    display: {
      label: 'New Request Func',
      description: 'Makes an http request via z.request with single url param.'
    },
    operation: {
      perform: (z /* , bundle */) => {
        return z
          .request('http://zapier-httpbin.herokuapp.com/get')
          .then(resp => {
            return JSON.parse(resp.content);
          });
      }
    }
  }
};

const WorkingFunc = {
  key: 'workingfunc',
  noun: 'workingfunc',
  list: {
    display: {
      label: 'New Working Func',
      description: 'Just works on sync function.'
    },
    operation: {
      perform: (/* z, bundle */) => {
        return [{ id: 1234 }];
      }
    }
  }
};

const WorkingFuncAsync = {
  key: 'workingfuncasync',
  noun: 'workingfuncasync',
  list: {
    display: {
      label: 'New Working Async Func',
      description: 'Just works on an async function.'
    },
    operation: {
      perform: (z, bundle, cb) => {
        return cb(null, [{ id: 2345 }]);
      }
    }
  }
};

const WorkingFuncPromise = {
  key: 'workingfuncpromise',
  noun: 'workingfuncpromise',
  list: {
    display: {
      label: 'New Working Promise',
      description: 'Just works on an promise.'
    },
    operation: {
      perform: () => {
        return Promise.resolve([{ id: 3456 }]);
      }
    }
  }
};

const FailerHttp = {
  key: 'failerhttp',
  noun: 'failerhttp',
  list: {
    display: {
      label: 'New Failer',
      description: 'Just fails on HTTP.'
    },
    operation: {
      perform: {
        url: 'http://zapier-httpbin.herokuapp.com/status/403'
      }
    }
  }
};

const FailerFunc = {
  key: 'failerfunc',
  noun: 'failerfunc',
  list: {
    display: {
      label: 'New Failer Func',
      description: 'Just fails on sync function.'
    },
    operation: {
      perform: (/* z, bundle */) => {
        throw new Error('Failer on sync function!');
      }
    }
  }
};

const FailerFuncAsync = {
  key: 'failerfuncasync',
  noun: 'failerfuncasync',
  list: {
    display: {
      label: 'New Failer Func Async',
      description: 'Just fails on async function.'
    },
    operation: {
      /*eslint no-unused-vars: 0*/
      perform: (z, bundle, cb) => {
        setTimeout(() => {
          throw new Error('Failer on async function!');
        }, 0);
      }
    }
  }
};

const FailerFuncPromise = {
  key: 'failerfuncpromise',
  noun: 'failerfuncpromise',
  list: {
    display: {
      label: 'New Failer Promise',
      description: 'Just fails on an promise.'
    },
    operation: {
      perform: () => {
        return Promise.reject(new Error('Failer on promise function!'));
      }
    }
  }
};

const StaticInputFields = {
  key: 'staticinputfields',
  noun: 'staticinputfields',
  list: {
    display: {
      label: 'static input fields',
      description: 'has static input fields'
    },
    operation: {
      inputFields: [{ key: 'key 1' }, { key: 'key 2' }, { key: 'key 3' }],
      outputFields: [{ key: 'key 1' }, { key: 'key 2' }, { key: 'key 3' }],
      perform: () => {}
    }
  }
};

const DynamicSyncInputFields = {
  key: 'dynamicsyncinputfields',
  noun: 'dynamicsyncinputfields',
  list: {
    display: {
      label: 'dynamic sync fields',
      description: 'sync function input fields'
    },
    operation: {
      inputFields: (z, bundle) => [
        { key: bundle.key1 },
        { key: bundle.key2 },
        { key: bundle.key3 }
      ],
      outputFields: (z, bundle) => [
        { key: bundle.key1 },
        { key: bundle.key2 },
        { key: bundle.key3 }
      ],
      perform: () => {}
    }
  }
};

const DynamicAsyncInputFields = {
  key: 'dynamicasyncinputfields',
  noun: 'dynamicasyncinputfields',
  list: {
    display: {
      label: 'dynamic async fields',
      description: 'input fields are a promise'
    },
    operation: {
      inputFields: Promise.resolve([
        { key: 'key 1' },
        { key: 'key 2' },
        { key: 'key 3' }
      ]),
      outputFields: Promise.resolve([
        { key: 'key 1' },
        { key: 'key 2' },
        { key: 'key 3' }
      ]),
      perform: () => {}
    }
  }
};

const MixedInputFields = {
  key: 'mixedinputfields',
  noun: 'mixedinputfields',
  list: {
    display: {
      label: 'mixed input fields',
      description:
        'input fields are static, a sync function, and an async promise'
    },
    operation: {
      inputFields: [
        { key: 'key 1' },
        (z, bundle) => Promise.resolve({ key: bundle.key2 }),
        Promise.resolve({ key: 'key 3' })
      ],
      outputFields: [
        { key: 'key 1' },
        (z, bundle) => Promise.resolve({ key: bundle.key2 }),
        Promise.resolve({ key: 'key 3' })
      ],
      perform: () => {}
    }
  }
};

const HonkerDonker = {
  key: 'honkerdonker',
  noun: 'honkerdonker',
  get: {
    display: {
      label: 'Get a big honking object',
      description: 'This will be dehydrated by list'
    },
    operation: {
      perform: (z, bundle) => `honker donker number ${bundle.honkerId}`
    }
  },
  list: {
    display: {
      label: 'Trigger on new thing in list',
      description: 'Will include dehydrated data'
    },
    operation: {
      perform: (z, bundle) => {
        const honkerIds = [1, 2, 3];
        return honkerIds.map(id => {
          return z.dehydrate(HonkerDonker.get.operation.perform, {
            honkerId: id
          });
        });
      }
    }
  }
};

const ExecuteRequestAsFunc = {
  key: 'executeRequestAsFunc',
  noun: 'Request',
  list: {
    display: {
      label: 'Configurable Request (func)',
      description: 'Used for one-offs in the tests.'
    },
    operation: {
      perform: (z, bundle) => {
        const req = _.defaults({}, bundle.inputData.options);
        return z.request(req).then(resp => {
          return bundle.inputData.returnValue || JSON.parse(resp.content);
        });
      },
      inputFields: [
        { key: 'options', dict: true },
        { key: 'returnValue', list: true }
      ]
    }
  }
};

const ExecuteRequestAsShorthand = {
  key: 'executeRequestAsShorthand',
  noun: 'Request',
  list: {
    display: {
      label: 'Configurable Request (shorthand)',
      description: 'Used for one-offs in the tests.'
    },
    operation: {
      perform: {
        url: '{{bundle.inputData.url}}'
      },
      inputFields: [
        {
          key: 'url',
          default: 'http://zapier-httpbin.herokuapp.com/status/403'
        }
      ]
    }
  }
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

/*
  After HTTP middleware that looks at the response content, and
  changes the status code if there's an error. Something like this
  could be useful for APIs that always return 200 even on errors.
 */
const changeStatusOnErrorResponses = response => {
  const contentType = response.getHeader('Content-Type');
  if (!contentType) {
    return response;
  }

  const isJsonResponse = contentType.match(/^application\/json/);
  if (!isJsonResponse) {
    return response;
  }

  const data = JSON.parse(response.content);
  const error = data.args.error;
  if (response.status === 200 && error) {
    response.status = 500;
  }
  return response;
};

const App = {
  title: 'Example App',
  beforeRequest: addRequestHeader,
  afterResponse: [changeStatusOnErrorResponses],
  resources: {
    [List.key]: List,
    [Contact.key]: Contact,
    [ContactError.key]: ContactError,
    [LoggingFunc.key]: LoggingFunc,
    [RequestFunc.key]: RequestFunc,
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
    [HonkerDonker.key]: HonkerDonker,
    [ExecuteRequestAsFunc.key]: ExecuteRequestAsFunc,
    [ExecuteRequestAsShorthand.key]: ExecuteRequestAsShorthand
  },
  hydrators: {
    getBigStuff: () => {}
  }
};

module.exports = App;
