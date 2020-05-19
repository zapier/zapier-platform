/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('newFile', () => {
  test('fetch files', async () => {
    const bundle = {};
    const results = await appTester(
      App.triggers.newFile.operation.perform,
      bundle
    );

    expect(results.length).toBeGreaterThan(0);

    // The 'hydrate|||' thing how Zapier represents dehydrated data
    const firstFile = results[0];
    expect(firstFile).toEqual({
      id: expect.stringMatching(/^https:/),
      file: expect.stringMatching(/^hydrate\|\|\|/),
    });
  });
});
