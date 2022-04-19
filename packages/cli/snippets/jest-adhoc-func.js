/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  test('new recipe', async () => {
    const adHocResult = await appTester(
      // your in-line function takes the same [z, bundle] arguments as normal
      async (z, bundle) => {
        // requests are made using your integration's actual middleware
        // make sure to pass the normal `bundle` arg to `appTester` if your requests need auth
        const response = await z.request(
          'https://example.com/some/setup/method',
          {
            params: {
              numItems: bundle.inputData.someValue,
            },
          }
        );

        return {
          // you can use all the functions on the `z` object
          someHash: z.hash('md5', 'mySecret'),
          data: response.data,
        };
      },
      {
        // you must provide auth data for authenticated requests
        // (just like running a normal trigger)
        authData: { token: 'some-api-key' },
        // put arbitrary function params in `inputData`
        inputData: {
          someValue: 3,
        },
      }
    );

    expect(adHocResult.someHash).toEqual('a5beb6624e092adf7be31176c3079e64');
    expect(adHocResult.data).toEqual({ whatever: true });

    // ... rest of test
  });
});
