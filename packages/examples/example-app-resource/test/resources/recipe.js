require('should');

const zapier = require('@zapier/zapier-platform-core');

const appTester = zapier.createAppTester(require('../../index'));

describe('recipe resource', () => {
  it('should get an existing recipes', (done) => {
    const bundle = {
      inputData: {
        id: 1
      }
    };

    appTester('resources.recipe.get.operation.perform', bundle)
      .then((resp) => {
        resp.results.name.should.eql('name 1');
        resp.results.directions.should.eql('directions 1');
        done();
      })
      .catch(done);
  });

  it('should list existing recipes', (done) => {
    const bundle = {
      inputData: {
        style: 'mediterranean'
      }
    };

    appTester('resources.recipe.list.operation.perform', bundle)
      .then((resp) => {
        const results = resp.results;
        results.length.should.above(0);

        const firstRecipe = results[0];
        firstRecipe.name.should.eql('name 1');
        firstRecipe.directions.should.eql('directions 1');
        done();
      })
      .catch(done);
  });

  it('should create a new recipe', (done) => {
    const bundle = {
      inputData: {
        name: 'Smith Family Recipe',
        directions: '1. Order out :)',
        authorId: 1
      }
    };

    appTester('resources.recipe.create.operation.perform', bundle)
      .then((resp) => {
        resp.results.should.have.property('name');
        done();
      })
      .catch(done);
  });
});
