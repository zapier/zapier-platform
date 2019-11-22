require('should');
const misc = require('../../utils/misc');

describe('misc utils', () => {
  describe('isValidNodeVersion', () => {
    it('should return true when valid node version', () => {
      misc.isValidNodeVersion().should.equal(true);
    });
    it('should return true when not a valid node version', () => {
      misc.isValidNodeVersion('v1.2.3').should.equal(false);
    });
  });
});
