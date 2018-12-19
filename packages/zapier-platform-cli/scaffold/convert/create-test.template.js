require('should');

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);

describe('Create - <%= key %>', () => {
  zapier.tools.env.inject();

  it('should create an object', async () => {
    const bundle = {
      authData: <%= authData %>,
<% if (inputData) { %>
      inputData: <%= inputData %>
<% } %>
    };

    const result = await appTester(App.creates['<%= key %>'].operation.perform, bundle);
    result.should.not.be.an.Array();
  });
});
