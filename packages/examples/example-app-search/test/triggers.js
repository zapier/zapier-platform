require('should');

const zapier = require('@zapier/zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('triggers', () => {

  describe('new recipe trigger', () => {
    it('should load recipes', (done) => {
      const bundle = {
        inputData: {
          style: 'mediterranean'
        }
      };

      appTester('triggers.recipe', bundle)
        .then((resp) => {
          const results = resp.results;
          results.length.should.eql(10);

          const firstRecipe = results[0];
          firstRecipe.name.should.eql('name 1');
          firstRecipe.directions.should.eql('directions 1');

          done();
        })
        .catch(done);
    });
  });

});
