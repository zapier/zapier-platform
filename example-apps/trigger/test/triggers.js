require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {

  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      const bundle = {
        inputData: {
          style: 'style 2'
        }
      };

      appTester(App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.above(0);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 2');
          firstRecipe.directions.should.eql('directions 2');

          done();
        })
        .catch(done);
    });

    it('should load recipes without filters', (done) => {
      const bundle = {};

      appTester(App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.above(1);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });
  });

});
