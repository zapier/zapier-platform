'use strict';

const createApp = require('../src/create-app');
const createInput = require('../src/tools/create-input');
const dataTools = require('../src/tools/data');
const exampleAppDefinition = require('./userapp');

describe('app middleware', () => {
  const createTestInput = (method, appDefinition) => {
    const event = {
      bundle: {},
      method,
    };

    return createInput(appDefinition, event);
  };

  it('should support before middleware', (done) => {
    const appDefinition = dataTools.deepCopy(exampleAppDefinition);
    appDefinition.beforeApp = [
      (input) => {
        // Swap up context to point to a real method
        input._zapier.event.method = 'resources.list.list.operation.perform';
        return input;
      },
    ];
    const app = createApp(appDefinition);

    // Create the input to point to a non-existent method on the app
    // the before middleware is gonna re-route this to a real method
    const input = createTestInput(
      'something.that.does.not.exist',
      appDefinition
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should support after middleware', (done) => {
    const appDefinition = dataTools.deepCopy(exampleAppDefinition);
    appDefinition.afterApp = [
      (output) => {
        output.results = [{ id: 'something new' }];
        return output;
      },
    ];
    const app = createApp(appDefinition);

    // We are gonna invoke this method, but the after middleware is gonna
    // change the result returned to something else
    const input = createTestInput(
      'resources.list.list.operation.perform',
      appDefinition
    );

    app(input)
      .then((output) => {
        output.results.should.eql([{ id: 'something new' }]);
        done();
      })
      .catch(done);
  });
});
