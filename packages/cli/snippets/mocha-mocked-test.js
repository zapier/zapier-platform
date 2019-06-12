require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

const nock = require('nock');

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', done => {
      const bundle = {
        inputData: {
          style: 'mediterranean'
        }
      };

      // mocks the next request that matches this url and querystring
      nock('http://57b20fb546b57d1100a3c405.mockapi.io/api')
        .get('/recipes')
        .query(bundle.inputData)
        .reply(200, [
          { name: 'name 1', directions: 'directions 1', id: 1 },
          { name: 'name 2', directions: 'directions 2', id: 2 }
        ]);

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

    it('should load recipes without filters', done => {
      const bundle = {};

      // each test needs its own mock
      nock('http://57b20fb546b57d1100a3c405.mockapi.io/api')
        .get('/recipes')
        .reply(200, [
          { name: 'name 1', directions: 'directions 1', id: 1 },
          { name: 'name 2', directions: 'directions 2', id: 2 }
        ]);

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
