/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {
  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      appTester(App.triggers.recipe.operation.perform)
        .then((results) => {
          results.should.be.an.Array();
          results.length.should.be.above(1);

          // Make sure the results are ordered by id desc
          let i = 0;
          while (i < results.length - 1) {
            const cur = results[i];
            const nxt = results[i + 1];
            cur.id.should.be.aboveOrEqual(nxt.id);
            i++;
          }

          done();
        })
        .catch(done);
    });
  });

  describe('new movie trigger', () => {
    it('should load movies', (done) => {
      appTester(App.triggers.movie.operation.perform)
        .then((results) => {
          results.should.be.an.Array();
          results.length.should.be.above(1);

          // Make sure the results are ordered by id desc
          let i = 0;
          while (i < results.length - 1) {
            const cur = results[i];
            const nxt = results[i + 1];
            cur.id.should.be.aboveOrEqual(nxt.id);
            i++;
          }

          done();
        })
        .catch(done);
    });
  });
});
