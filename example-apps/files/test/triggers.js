require('should');
const zapier = require('zapier-platform-core');
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('triggers', () => {

  describe('newFile', () => {
    it('should load files', (done) => {
      const bundle = {};

      appTester(App.triggers.newFile.operation.perform, bundle)
        .then(results => {
          results.length.should.above(0);

          const firstFile = results[0];
          firstFile.should.have.property('id');
          firstFile.should.have.property('name');
          firstFile.should.have.property('filename');
          firstFile.file.should.containEql('hydrate|||');

          done();
        })
        .catch(done);
    });
  });

});
