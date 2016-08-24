require('should');

const zapier = require('@zapier/zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('triggers', () => {

  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      appTester('triggers.new-recipe')
        .then((resp) => {
          const results = resp.results;
          results.length.should.eql(10);

          // Middleware should apply reverse chronological sorting, so
          // first recipe returned should have id: '1'
          const firstRecipe = results[0];
          firstRecipe.id.should.eql('1');

          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });
  });

});
