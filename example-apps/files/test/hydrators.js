require('should');
const zapier = require('zapier-platform-core');
const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('hydrators', () => {

  describe('uploadFile', () => {
    it('should download files', function(done) {
      if (!process.env.ZAPIER_DEPLOY_KEY || process.env.ZAPIER_DEPLOY_KEY === 'undefined') {
        this.skip();
      }

      const bundle = {
        inputData: {
          fileId: 3,
        },
      };

      appTester(App.hydrators.downloadFile, bundle)
        .then(url => {
          url.should.containEql('https://zapier-dev-files.s3.amazonaws.com/cli-platform/');
          done();
        })
        .catch(done);
    });
  });

});
