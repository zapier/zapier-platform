require('should');

const { IS_TESTING } = require('../constants');

describe('testing setup', () => {
  it('should set IS_TESTING to true', () => {
    IS_TESTING.should.be.true();
  });
});
