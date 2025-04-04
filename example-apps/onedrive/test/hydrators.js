require('should');

const zapier = require('zapier-platform-core');

const testUtils = require('./test-utils');
const App = require('../index');
const appTester = zapier.createAppTester(App);

const TEST_RESOURCES = testUtils.TEST_RESOURCES;

describe('Hydrators', () => {
  before(testUtils.globalBeforeSetup);

  it('should get file contents', (done) => {
    const bundle = {
      authData: {
        access_token: process.env.ACCESS_TOKEN,
      },
      inputData: {
        id: TEST_RESOURCES.root.id,
      },
    };

    appTester(App.hydrators.getFileContents, bundle)
      .then((fileContents) => {
        fileContents.length.should.above(0);
        done();
      })
      .catch(done);
  });

  it('should get unicode file contents', (done) => {
    // CODE TIP: Hydrating files often involves touching the raw bytes (and
    // handling the file names), so it's a good idea to test different edge cases
    done();
  });

  it('should not get file contents for big files', (done) => {
    // An example edge case that would be worth testing
    done();
  });

  it('should not get file contents for binary files', (done) => {
    // An example edge case that would be worth testing
    done();
  });
});
