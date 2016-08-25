require('should');

const zapier = require('@zapier/zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('triggers', () => {

  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      const bundle = {
        inputData: {
          style: 'style 10'
        }
      };

      appTester('searches.search-recipes', bundle)
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
