require('should');
const misc = require('../../utils/misc');

describe('misc utils', () => {
  describe('isValidNodeVersion', () => {
    it('should return true when valid node version', () => {
      misc.isValidNodeVersion().should.equal(true);
    });
  });
});
