'use strict';

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

      const logs = new Buffer(data.LogResult, 'base64').toString();
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
    it('should return data from app function call', done => {
      const event = {
        command: 'execute',
        method: 'resources.list.list.operation.perform',
        bundle: {
          'param a': 'say, can u see me?',
          'param b': 'oh, can u see me too?'
        }
      };
      runner(event)
        .then(response => {
          should.exist(response.results);
          response.results.should.eql([{ id: 1234 }, { id: 5678 }]);
          done();
        })
        .catch(done);
    });

    it('should validate an app', done => {
      const event = {
        command: 'validate'
      };
      runner(event)
        .then(response => {
          should.exist(response.results);
          done();
        })
        .catch(done);
    });

    it('should provide the definition for an app', done => {
      const event = {
        command: 'definition'
      };
      runner(event)
        .then(response => {
          should.exist(response.results);
          done();
        })
        .catch(done);
    });

    it('should do a logging function', done => {
      const event = {
        command: 'execute',
        method: 'resources.loggingfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666
        }
      };
      runner(event)
        .then(response => {
          should.exist(response.results);
          done();
        })
        .catch(done);
    });

    it('should log requests', done => {
      const event = {
        command: 'execute',
        method: 'resources.requestfunc.list.operation.perform',
        logExtra: {
          app_cli_id: 666
        }
      };
      runner(event)
        .then(response => {
          should.exist(response.results);
          done();
        })
        .catch(done);
    });

    describe('error handling', () => {
      const testError = (method, errorMessage) => {
        it(`should catch errors from ${method}`, done => {
          const event = {
            command: 'execute',
            method
          };
          runner(event)
            .then(() => {
              done('expected an eror');
            })
            .catch(err => {
              should.exist(err);
              err.message.should.startWith(errorMessage);
              done();
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
  doTest(runLambda);
  doTest(runLocally);
}

module.exports = {
  runLambda,
  runLocally,
  doTest
};
