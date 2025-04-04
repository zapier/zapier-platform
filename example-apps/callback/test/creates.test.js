/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('creates', () => {
  test('perform function returns intermediate data', async () => {
    const bundle = { inputData: { question: 'Will this work?' } };
    const result = await appTester(
      App.creates.prediction.operation.perform,
      bundle,
    );
    expect(result).toMatchObject({
      status: '...thinking...',
      callbackUrl: 'https://auth-json-server.zapier-staging.com/echo',
      extra: 'data',
    });
  });

  test('performResume function returns "final" data', async () => {
    const bundle = {
      outputData: {
        callbackUrl: 'https://auth-json-server.zapier-staging.com/echo',
        status: '...thinking...',
        extra: 'data',
      },
      cleanedRequest: {
        status: 'success',
        result: 'Ask again later.',
      },
    };

    const result = await appTester(
      App.creates.prediction.operation.performResume,
      bundle,
    );
    expect(result).toMatchObject({
      status: 'success',
      result: 'Ask again later.',
      callbackUrl: 'https://auth-json-server.zapier-staging.com/echo',
    });
  });
});
