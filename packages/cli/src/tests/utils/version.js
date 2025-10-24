const should = require('should');
const { throwForInvalidVersion } = require('../../utils/version');

describe('version utils', () => {
  describe('throwForInvalidVersion', () => {
    describe('valid versions', () => {
      const validVersions = [
        '1.0.0',
        '0.0.0',
        '999.999.999',
        '1.2.0-beta',
        '0.0.0-ISSUE-123',
      ];

      validVersions.forEach((version) => {
        it(`should not throw for valid version: ${version}`, () => {
          (() => throwForInvalidVersion(version)).should.not.throw();
        });
      });
    });

    describe('invalid versions', () => {
      const invalidVersions = [
        // Core invalid patterns from VersionSchema
        '1.0.0.0', // Too many periods
        '1000.0.0', // Number too large (>999)
        'v1.0.0', // Prefix not allowed
        '1.0.0-rc.1', // Period in label
        '1.0.0--', // Double dash
        '1.0.0-', // Empty label
        '1.0', // Missing patch version
        '01.0.0', // Leading zero
      ];

      invalidVersions.forEach((version) => {
        it(`should throw for invalid version: "${version}"`, () => {
          (() => throwForInvalidVersion(version)).should.throw(
            Error,
            /is an invalid version str/,
          );
        });
      });
    });

    describe('error message', () => {
      it('should include helpful suggestion', () => {
        try {
          throwForInvalidVersion('invalid');
          should.fail('Should have thrown an error');
        } catch (error) {
          error.message.should.equal(
            'invalid is an invalid version str. Try something like `1.2.3` or `0.0.0-TICKET`',
          );
        }
      });
    });

    describe('edge cases', () => {
      it('should handle undefined gracefully', () => {
        (() => throwForInvalidVersion(undefined)).should.throw(TypeError);
      });

      it('should handle null gracefully', () => {
        (() => throwForInvalidVersion(null)).should.throw(TypeError);
      });
    });
  });
});
