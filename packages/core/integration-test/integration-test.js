'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const AWS = require('aws-sdk');
const crypto = require('crypto');
const nock = require('nock');
const should = require('should');

const createLambdaHandler = require('../src/tools/create-lambda-handler');
const mocky = require('../test/tools/mocky');

const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: 'us-east-1',
});

const runLambda = (event) => {
  return new Promise((resolve, reject) => {
    const params = {
      FunctionName: 'integration-test-cli',
      Payload: JSON.stringify(event),
      LogType: 'Tail',
    };

    lambda.invoke(params, (err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }

      const logs = Buffer.from(data.LogResult, 'base64').toString();
      console.log('\n=== LOGS ===\n', logs, '\n===\n');

      const response = data.Payload ? JSON.parse(data.Payload) : data;
      if (response.errorMessage) {
        return reject(new Error(response.errorMessage));
      }

      return resolve(response);
    });
  });
};
runLambda.testName = 'runLambda';

const runLocally = (event) => {
  return new Promise((resolve, reject) => {
    const handler = createLambdaHandler(
      path.resolve(__dirname, '../test/userapp')
    );

    handler(event, {}, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
};
runLocally.testName = 'runLocally';

const doTest = (runner) => {
  describe(`${runner.testName} integration tests`, () => {
    afterEach(() => {
      // Clear cache files
      const tmpdir = os.tmpdir();
      const cacheFilenames = ['cli-override.json', 'cli-hash.txt'];
      cacheFilenames.forEach((filename) => {
        const filepath = path.join(tmpdir, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });

      // Remove all the mocked requests
      nock.cleanAll();
    });

    it('should return data from app function call', () => {
      const event = {
        command: 'execute',
        method: 'resources.list.list.operation.perform',
        bundle: {
          'param a': 'say, can u see me?',
          'param b': 'oh, can u see me too?',
        },
      };
      return runner(event).then((response) => {
        should.exist(response.results);
        response.results.should.eql([{ id: 1234 }, { id: 5678 }]);
      });
    });

    it('should validate an app', () => {
      const event = {
        command: 'validate',
      };
      return runner(event).then((response) => {
        should.exist(response.results);
      });
    });

    it('should provide the definition for an app', () => {
      const event = {
        command: 'definition',
      };
      return runner(event).then((response) => {
        should.exist(response.results);
      });
    });

    it('should do a logging function', () => {
      const event = {
        command: 'execute',
        method: 'resources.loggingfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666,
        },
      };
      return runner(event).then((response) => {
        should.exist(response.results);
      });
    });

    it('should handle appRawOverride', () => {
      const event = {
        command: 'execute',
        method: 'triggers.fooList.operation.perform',
        appRawOverride: {
          resources: {
            foo: {
              key: 'foo',
              noun: 'Foo',
              list: {
                display: {},
                operation: {
                  perform: { source: 'return [{id: 45678}]' },
                },
              },
            },
          },
        },
      };
      return runner(event).then((response) => {
        response.results.should.deepEqual([{ id: 45678 }]);
      });
    });

    it('should handle appRawOverride as hash', () => {
      const definition = {
        resources: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            list: {
              display: {},
              operation: {
                perform: { source: 'return [{id: 45678}]' },
              },
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'triggers.fooList.operation.perform',
        appRawOverride: definitionHash,
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.length.should.eql(1);
        response.results[0].id.should.eql(45678);
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension]', () => {
      const definition = {
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            operation: {
              perform: { source: 'return [{id: 12345}]' },
              inputFields: [{ key: 'name', type: 'string' }],
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        creates: {
          foo: {
            noun: 'Foobar',
            operation: {
              inputFields: [{ key: 'message', type: 'string' }],
              sample: {
                id: 678,
              },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'creates.foo.operation.inputFields',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.eql([
          { key: 'name', type: 'string' },
          { key: 'message', type: 'string' },
        ]);
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension] and override perform with request', () => {
      const definition = {
        triggers: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            operation: {
              perform: {
                url: 'https://httpbin.org/get',
                params: {
                  id: 54321,
                },
              },
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        triggers: {
          foo: {
            noun: 'Foobar',
            operation: {
              perform: { source: 'return [{id: 12345}]' },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'triggers.foo.operation.perform',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.eql([{ id: 12345 }]);
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension] and override perform with source', () => {
      const definition = {
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            operation: {
              perform: { source: 'return [{id: 12345}]' },
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        creates: {
          foo: {
            noun: 'Foobar',
            operation: {
              perform: {
                method: 'POST',
                url: 'https://httpbin.org/post',
                params: {
                  id: 54321,
                },
              },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'creates.foo.operation.perform',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.containEql({
          args: {
            id: '54321',
          },
        });
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension] and override perform with function', () => {
      const definition = {
        searches: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            operation: {
              perform: '$func$2$f$',
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        searches: {
          foo: {
            noun: 'Foobar',
            operation: {
              perform: { source: 'return [{id: 12345}]' },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'searches.foo.operation.perform',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.eql([
          {
            id: 12345,
          },
        ]);
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension] and add perform', () => {
      const definition = {
        triggers: {
          test: {
            key: 'test',
            noun: 'Foo',
            operation: {
              type: 'hook',
              performList: { source: 'return [{id: 54321}]' },
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        triggers: {
          test: {
            operation: {
              perform: { source: 'return [{id: 12345}]' },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'triggers.test.operation.perform',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.eql([
          {
            id: 12345,
          },
        ]);
      });
    });

    it('should handle array of [appRawOverrideHash, appRawExtension] and add new trigger', () => {
      const definition = {
        triggers: {
          test: {
            key: 'test',
            noun: 'Foo',
            operation: {
              perform: { source: 'return [{id: 54321}]' },
            },
          },
        },
      };

      mocky.mockRpcCall(definition);

      const definitionExtension = {
        triggers: {
          perform: {
            key: 'perform',
            noun: 'Foo',
            operation: {
              perform: { source: 'return [{id: 12345}]' },
            },
          },
        },
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'triggers.perform.operation.perform',
        appRawOverride: [definitionHash, definitionExtension],
        rpc_base: 'https://mock.zapier.com/platform/rpc/cli',
        token: 'fake',
      };

      return runner(event).then((response) => {
        response.results.should.eql([
          {
            id: 12345,
          },
        ]);
      });
    });

    it('should handle function source in beforeRequest', () => {
      const definition = {
        beforeRequest: [
          {
            source: "request.headers['X-Foo'] = 'it worked!'; return request",
            args: ['request', 'z', 'bundle'],
          },
        ],
        creates: {
          foo: {
            operation: {
              perform: {
                method: 'POST',
                url: 'https://httpbin.org/post',
              },
            },
          },
        },
      };

      const event = {
        command: 'execute',
        method: 'creates.foo.operation.perform',
        appRawOverride: definition,
      };

      return runner(event).then((response) => {
        response.results.headers['X-Foo'].should.eql('it worked!');
      });
    });

    it('should log requests', () => {
      const event = {
        command: 'execute',
        method: 'resources.requestfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666,
        },
      };
      return runner(event).then((response) => {
        should.exist(response.results);
      });
    });

    it('should not leave leftover env vars', () => {
      const event = {
        environment: {
          _ZAPIER_ONE_TIME_SECRET: 'foo',
        },
        method: 'resources.env.list.operation.perform',
      };
      return runner(event)
        .then((response) => {
          response.results.length.should.eql(1);
          response.results[0].key.should.eql('_ZAPIER_ONE_TIME_SECRET');
          response.results[0].value.should.eql('foo');

          delete event.environment;
          return runner(event);
        })
        .then((response) => {
          response.results.length.should.eql(0);
        });
    });

    describe('error handling', () => {
      const testError = (method, errorMessage) => {
        it(`should catch errors from ${method}`, () => {
          const event = {
            command: 'execute',
            method,
          };
          return runner(event)
            .then(() => {
              should(true).eql(false, 'Expected an error!');
            })
            .catch((err) => {
              should.exist(err);
              err.message.should.startWith(errorMessage);
            });
        });
      };

      testError(
        'triggers.failerfuncasyncList.operation.perform',
        'Failer on async function!'
      );
      testError(
        'resources.failerfunc.list.operation.perform',
        'Failer on sync function!'
      );
      testError(
        'resources.failerfuncpromise.list.operation.perform',
        'Failer on promise function!'
      );
    });
  });
};

if (process.argv.indexOf('integration-test') > 0) {
  if (process.argv.indexOf('--lambda') > 0) {
    doTest(runLambda);
  } else if (process.argv.indexOf('--local') > 0) {
    doTest(runLocally);
  } else {
    doTest(runLambda);
    doTest(runLocally);
  }
}

module.exports = {
  runLambda,
  runLocally,
  doTest,
};
