require('should');
const zapier = require('zapier-platform-core');
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('creates', () => {

  describe('uploadFile', () => {
    it('should upload file without name', (done) => {
      const bundle = {
        inputData: {
          filename: 'sample.pdf',

          // in production, this will be an hydration URL to the selected file's data
          file: 'https://cdn.zapier.com/storage/files/f6679cf77afeaf6b8426de8d7b9642fc.pdf',
        }
      };

      appTester(App.creates.uploadFile.operation.perform, bundle)
        .then((result) => {
          result.should.have.property('id');
          result.name.should.containEql('sample.pdf');
          result.filename.should.eql('sample.pdf');
          result.file.should.containEql('hydrate|||');

          done();
        })
        .catch(done);
    });

    it('should upload file with name', (done) => {
      const bundle = {
        inputData: {
          name: 'Sample',
          filename: 'sample.pdf',

          // in production, this will be an hydration URL to the selected file's data
          file: 'https://cdn.zapier.com/storage/files/f6679cf77afeaf6b8426de8d7b9642fc.pdf',
        }
      };

      appTester(App.creates.uploadFile.operation.perform, bundle)
        .then((result) => {
          result.should.have.property('id');
          result.name.should.eql('Sample');
          result.filename.should.eql('sample.pdf');
          result.file.should.containEql('hydrate|||');

          done();
        })
        .catch(done);
    });
  });

});
