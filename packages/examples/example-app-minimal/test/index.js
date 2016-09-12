require('should');

const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const appTester = zapier.createAppTester(require('../index'));

describe('My App', () => {

  it('should test something', (done) => {
    const x = 1;
    x.should.eql(1);
    done();
  });

});
