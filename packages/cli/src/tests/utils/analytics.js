require('should');
const { shouldSkipAnalytics } = require('../../utils/analytics');

describe('analytics', () => {
  // causes a lot of noise
  it('should not run analytics when testing', () => {
    shouldSkipAnalytics().should.be.true();
  });
});
