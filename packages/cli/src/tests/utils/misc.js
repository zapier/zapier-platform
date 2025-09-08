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

  describe('validateStandardVersion', () => {
    it('should not throw for valid standard versions', () => {
      (() => misc.validateStandardVersion('1.0.0')).should.not.throw();
      (() => misc.validateStandardVersion('10.25.3')).should.not.throw();
      (() => misc.validateStandardVersion('0.0.1')).should.not.throw();
      (() => misc.validateStandardVersion('999.999.999')).should.not.throw();
    });

    it('should throw for versions with labels', () => {
      (() => misc.validateStandardVersion('1.0.0-beta')).should.throw(
        /must contain numbers only/,
      );
      (() => misc.validateStandardVersion('999.999.999-alpha.1')).should.throw(
        /must contain numbers only/,
      );
    });

    it('should include the invalid version in error message', () => {
      (() => misc.validateStandardVersion('1.0.0-beta')).should.throw(
        /Version "1\.0\.0-beta"/,
      );
    });
  });
});
