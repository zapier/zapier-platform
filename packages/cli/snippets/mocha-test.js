// we use should assertions
const should = require('should');
const zapier = require('zapier-platform-core');

// createAppTester() makes it easier to test your app. It takes your
// raw app definition, and returns a function that will test you app.
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', done => {
      // This is what Zapier will send to your app as input.
      // It contains trigger options the user choice in their zap.
      const bundle = {
        inputData: {
          style: 'mediterranean'
        }
      };

      // Pass appTester the path to the trigger you want to call,
      // and the input bundle. appTester returns a promise for results.
      appTester(App.App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          // Make assertions

          results.length.should.eql(10);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('Baked Falafel');

          done();
        })
        .catch(done);
    });
  });
});
