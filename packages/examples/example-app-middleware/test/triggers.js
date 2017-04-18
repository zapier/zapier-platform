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

  describe('new movie trigger', () => {
    it('should load movies', (done) => {
      appTester(App.triggers.movie.operation.perform)
        .then(results => {
          const firstMovie = results[0];
          firstMovie.title.should.eql('title 1');

          done();
        })
        .catch(done);
    });
  });

});
