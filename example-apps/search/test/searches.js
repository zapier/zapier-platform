/* globals describe, it */

const should = require('should'); // required to use .exist()

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('searches', () => {
  describe('search recipe', () => {
    it('should find a recipe', (done) => {
      const bundle = {
        inputData: {
          style: 'style 2',
        },
      };

      appTester(App.searches.recipe.operation.perform, bundle)
        .then((results) => {
          results.length.should.be.aboveOrEqual(1);

          const firstRecipe = results[0];
          firstRecipe.style.should.eql('style 2');
          should.exist(firstRecipe.name);
          should.exist(firstRecipe.directions);

          done();
        })
        .catch(done);
    });
  });
});
