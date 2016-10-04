require('should');

const zapier = require('zapier-platform-core');

const appTester = zapier.createAppTester(require('../index'));

describe('creates', () => {

  describe('create recipe create', () => {
    it('should create a new recipe', (done) => {
      const bundle = {
        inputData: {
          name: 'Smith Family Recipe',
          directions: '1. Order out :)',
          authorId: 1
        }
      };

      appTester('creates.recipe', bundle)
        .then((result) => {
          result.should.have.property('name');
          done();
        })
        .catch(done);
    });
  });
});
