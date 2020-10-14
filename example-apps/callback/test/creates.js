/* globals describe, it */

require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('creates', () => {
  describe('create prediction create', () => {
    it('should perform as expected', (done) => {
      const performBundle = {
        inputData: {
          question: 'Will this work?',
        },
      };

      appTester(App.creates.prediction.operation.perform, performBundle)
        .then((result) => {
          result.should.have.property('status');
          result.status.should.equal('...thinking...');
          result.should.have.property('extra');
          result.extra.should.equal('data');
          result.should.have.property('callbackUrl');
          done();
        })
        .catch(done);
    });

    it('should performResume as expected', (done) => {
      const performResumeBundle = {
        outputData: {
          callbackUrl: 'https://zapier.com/hooks/catch/-1234/abcdef/',
          status: '...thinking...',
          extra: 'data',
        },
        cleanedRequest: {
          status: 'success',
          result: 'Ask again later.',
        },
      };

      appTester(
        App.creates.prediction.operation.performResume,
        performResumeBundle
      )
        .then((result) => {
          result.should.have.property('status');
          result.status.should.equal('success');
          result.should.have.property('result');
          result.result.should.equal('Ask again later.');
          result.should.have.property('callbackUrl');
          result.callbackUrl.should.equal(
            'https://zapier.com/hooks/catch/-1234/abcdef/'
          );
          result.should.not.have.property('extra');
          done();
        })
        .catch(done);
    });
  });
});
