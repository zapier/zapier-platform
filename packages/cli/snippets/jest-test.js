/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

// createAppTester() makes it easier to test your app. It takes your raw app
// definition, and returns a function that will test you app.
const App = require('../index');
const appTester = zapier.createAppTester(App);

// Inject the vars from the .env file to process.env. Do this if you have a .env
// file.
zapier.tools.env.inject();

describe('triggers', () => {
  test('new recipe', async () => {
    const bundle = {
      inputData: {
        style: 'mediterranean',
      },
    };

    const results = await appTester(
      App.triggers.recipe.operation.perform,
      bundle
    );
    expect(results.length).toBeGreaterThan(1);

    const firstRecipe = results[0];
    expect(firstRecipe.id).toBe(1);
    expect(firstRecipe.name).toBe('Baked Falafel');
  });
});
