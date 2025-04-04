/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');
const App = require('../index');

const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', async () => {
      const bundle = {
        inputData: {
          style: 'style 2',
        },
      };

      const results = await appTester(
        App.triggers.recipe.operation.perform,
        bundle,
      );

      results.length.should.above(0);

      const firstRecipe = results[0];
      firstRecipe.name.should.eql('name 2');
      firstRecipe.directions.should.eql('directions 2');
    });

    it('should load recipes without filters', async () => {
      const bundle = {};

      const results = await appTester(
        App.triggers.recipe.operation.perform,
        bundle,
      );

      results.length.should.above(1);

      const firstRecipe = results[0];
      firstRecipe.name.should.eql('name 1');
      firstRecipe.directions.should.eql('directions 1');
    });
  });
});
