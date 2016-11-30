require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('searches', () => {

  describe('search recipe', () => {
    it('should find a recipe', (done) => {
      const bundle = {
        inputData: {
          style: 'style 10'
        }
      };

      appTester(App.searches.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.eql(1);

          const firstRecipe = results[0];
          firstRecipe.style.should.eql('style 10');
          firstRecipe.name.should.eql('name 10');
          firstRecipe.directions.should.eql('directions 10');

          done();
        })
        .catch(done);
    });
  });

});
