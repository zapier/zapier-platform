require('should');
const misc = require('../../utils/misc');

describe('misc utils', () => {

  describe('readNvmVersion', () => {

    it('should return .nvmrc verson (without leading `v`)', () => {
      misc.readNvmVersion().should.equal('4.3.2');
    });

  });

  describe('isValidNodeVersion', () => {

    it('should return true when valid node version', () => {
      misc.isValidNodeVersion().should.equal(true);
    });

  });

});
