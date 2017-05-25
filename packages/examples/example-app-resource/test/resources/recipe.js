require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('recipe resource', () => {
  it('should get an existing recipe', (done) => {
    const bundle = {
      inputData: {
        id: 1
      }
    };

    appTester(App.resources.recipe.get.operation.perform, bundle)
      .then((results) => {
        results.name.should.eql('name 1');
        results.directions.should.eql('directions 1');
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

    appTester(App.resources.recipe.list.operation.perform, bundle)
      .then((results) => {
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

    appTester(App.resources.recipe.create.operation.perform, bundle)
      .then((results) => {
        results.should.have.property('name');
        done();
      })
      .catch(done);
  });

  it('should find a recipe', (done) => {
    const bundle = {
      inputData: {
        name: 'Smith Family Recipe',
      }
    };

    appTester(App.resources.recipe.search.operation.perform, bundle)
      .then((results) => {
        results[0].should.have.property('name');
        done();
      })
      .catch(done);
  });
});
