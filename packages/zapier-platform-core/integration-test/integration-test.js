'use strict';

const crypto = require('crypto');
const should = require('should');
const path = require('path');
const createLambdaHandler = require('../src/tools/create-lambda-handler');

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({
  apiVersion: '2015-03-31',
  region: 'us-east-1'
});

const runLambda = event => {
  return new Promise((resolve, reject) => {
    const params = {
      FunctionName: 'integration-test-dev-cli',
      Payload: JSON.stringify(event),
      LogType: 'Tail'
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

const runLocally = event => {
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

const doTest = runner => {
  describe(`${runner.testName} integration tests`, () => {
    it('should return data from app function call', () => {
      const event = {
        command: 'execute',
        method: 'resources.list.list.operation.perform',
        bundle: {
          'param a': 'say, can u see me?',
          'param b': 'oh, can u see me too?'
        }
      };
      return runner(event).then(response => {
        should.exist(response.results);
        response.results.should.eql([{ id: 1234 }, { id: 5678 }]);
      });
    });

    it('should validate an app', () => {
      const event = {
        command: 'validate'
      };
      return runner(event).then(response => {
        should.exist(response.results);
      });
    });

    it('should provide the definition for an app', () => {
      const event = {
        command: 'definition'
      };
      return runner(event).then(response => {
        should.exist(response.results);
      });
    });

    it('should do a logging function', () => {
      const event = {
        command: 'execute',
        method: 'resources.loggingfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666
        }
      };
      return runner(event).then(response => {
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
                  perform: { source: 'return [{id: 45678}]' }
                }
              }
            }
          }
        }
      };
      return runner(event).then(response => {
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
                perform: { source: 'return [{id: 45678}]' }
              }
            }
          }
        }
      };

      const definitionHash = crypto
        .createHash('md5')
        .update(JSON.stringify(definition))
        .digest('hex');

      const event = {
        command: 'execute',
        method: 'triggers.fooList.operation.perform',
        appRawOverride: definitionHash
      };

      return runner(event)
        .then(() => {
          should(true).eql(false, 'Should not have gotten results!');
        })
        .catch(err => {
          // We're not mocking RPC here (a bit convoluted to do so), so it'll fail at that point
          err.message.should.startWith('No deploy key found.');
          err.message.should.containEql('rely on the RPC API');
        });
    });

    it('should handle function source in beforeRequest', () => {
      const definition = {
        beforeRequest: [
          {
            source: "request.headers['X-Foo'] = 'it worked!'; return request",
            args: ['request', 'z', 'bundle']
          }
        ],
        creates: {
          foo: {
            operation: {
              perform: {
                method: 'POST',
                url: 'https://zapier-httpbin.herokuapp.com/post'
              }
            }
          }
        }
      };

      const event = {
        command: 'execute',
        method: 'creates.foo.operation.perform',
        appRawOverride: definition
      };

      return runner(event).then(response => {
        response.results.headers['X-Foo'].should.eql('it worked!');
      });
    });

    it('should log requests', () => {
      const event = {
        command: 'execute',
        method: 'resources.requestfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666
        }
      };
      return runner(event).then(response => {
        should.exist(response.results);
      });
    });

    describe('error handling', () => {
      const testError = (method, errorMessage) => {
        it(`should catch errors from ${method}`, () => {
          const event = {
            command: 'execute',
            method
          };
          return runner(event)
            .then(() => {
              should(true).eql(false, 'Expected an error!');
            })
            .catch(err => {
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
  doTest
};
