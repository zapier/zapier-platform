require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {

  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      appTester(App.triggers.recipe.operation.perform)
        .then(results => {
          const firstRecipe = results[0];
          firstRecipe.name.should.eql('Smith Family Recipe');

          done();
        })
        .catch(done);
    });
  });

});
