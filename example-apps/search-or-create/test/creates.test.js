/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('recipe', () => {
  test('create with a name', async () => {
    const bundle = { inputData: { name: 'Pancake' } };
    const result = await appTester(
      App.creates.recipe.operation.perform,
      bundle,
    );
    expect(result.id).toBeTruthy();
    expect(result.name).toBe('Pancake');
  });
});
