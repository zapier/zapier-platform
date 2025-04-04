/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('recipe', () => {
  test('search by name', async () => {
    const bundle = { inputData: { name: 'name 1' } };
    const results = await appTester(
      App.searches.recipe.operation.perform,
      bundle,
    );
    expect(results.length).toBeGreaterThan(0);

    const firstRecipe = results[0];
    expect(firstRecipe).toMatchObject({
      id: '1',
      name: 'name 1',
    });
  });
});
