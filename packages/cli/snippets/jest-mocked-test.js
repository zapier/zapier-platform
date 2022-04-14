/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const nock = require('nock');

describe('triggers', () => {
  test('new recipe', async () => {
    const bundle = {
      inputData: {
        style: 'mediterranean',
      },
    };

    // mocks the next request that matches this url and querystring
    nock('https://example.com/api')
      .get('/recipes')
      .query(bundle.inputData)
      .reply(200, [
        { name: 'name 1', directions: 'directions 1', id: 1 },
        { name: 'name 2', directions: 'directions 2', id: 2 },
      ]);

    const results = await appTester(
      App.triggers.recipe.operation.perform,
      bundle
    );

    expect(results.length).toBeGreaterThan(1);

    const firstRecipe = results[0];
    expect(firstRecipe.id).toBe(1);
    expect(firstRecipe.name).toBe('name 1');
  });
});
