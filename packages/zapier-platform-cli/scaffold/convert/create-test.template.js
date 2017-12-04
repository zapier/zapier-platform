require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Creates - <%= LABEL %>', () => {
  zapier.tools.env.inject();

  it('should create an object', (done) => {
    const bundle = {
      authData: <%= AUTH_DATA %>,
      inputData: {
        name: 'Testing',
      },
    };

    appTester(App.creates['<%= KEY %>'].operation.perform, bundle)
      .then((result) => {
        result.should.not.be.an.Array();
        result.should.have.property('id');
        done();
      })
      .catch(done);
  });

});
