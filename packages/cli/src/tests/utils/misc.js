require('should');
const misc = require('../../utils/misc');
const { NODE_VERSION_CLI_REQUIRES } = require('../../constants');
const packageJson = require('../../../package.json');

describe('misc utils', () => {
  describe('isValidNodeVersion', () => {
    it('should return true when valid node version', () => {
      misc.isValidNodeVersion().should.equal(true);
    });
    it('should return true when not a valid node version', () => {
      misc.isValidNodeVersion('v1.2.3').should.equal(false);
    });
  });

  describe('node version range', () => {
    it('should match engines.node in package.json', () => {
      packageJson.engines.node.should.equal(NODE_VERSION_CLI_REQUIRES);
    });
  });
});
