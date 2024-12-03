/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipe from fake hook', done => {
      const bundle = {
        inputData: {
          style: 'mediterranean'
        },
        cleanedRequest: {
          id: 1,
          name: 'name 1',
          directions: 'directions 1'
        }
      };

      appTester(App.triggers.recipe.operation.perform, bundle)
        .then(results => {
          results.length.should.eql(1);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });

    it('should load recipe from list', done => {
      const bundle = {
        inputData: {
          style: 'mediterranean'
        },
        meta: {
          frontend: true
        }
      };

      appTester(App.triggers.recipe.operation.performList, bundle)
        .then(results => {
          results.length.should.be.greaterThan(1);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });
  });
});
