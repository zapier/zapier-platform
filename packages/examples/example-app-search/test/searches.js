require('should');

const zapier = require('zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('searches', () => {

  describe('search recipe', () => {
    it('should find a recipe', (done) => {
      const bundle = {
        inputData: {
          style: 'style 10'
        }
      };

      appTester('searches.recipe', bundle)
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
