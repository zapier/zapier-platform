require('should');
const { isVersionCompatible } = require('../../utils/semver-compatibility');

describe('isVersionCompatible', () => {
  it('should properly determine semantic version compatibility', () => {
    // Changes between major versions are NOT compatible
    isVersionCompatible({
      versionCurrent: '1.0.0',
      versionGoal: '2.0.0',
    }).should.be.false();
    isVersionCompatible({
      versionCurrent: '2.0.0',
      versionGoal: '3.0.0',
    }).should.be.false();
    isVersionCompatible({
      versionCurrent: '2.9.90',
      versionGoal: '3.0.0',
    }).should.be.false();
    isVersionCompatible({
      versionCurrent: '2.0.0',
      versionGoal: '1.0.0',
    }).should.be.false();

    // Patch and minor versions that occur before are NOT compatible
    isVersionCompatible({
      versionCurrent: '1.0.1',
      versionGoal: '1.0.0',
    }).should.be.false();
    isVersionCompatible({
      versionCurrent: '1.1.0',
      versionGoal: '1.0.0',
    }).should.be.false();
    isVersionCompatible({
      versionCurrent: '1.5.11',
      versionGoal: '1.0.0',
    }).should.be.false();

    // Equal versions are not compatible (since we always include the `fromVersion` when migrating)
    isVersionCompatible({
      versionCurrent: '1.0.0',
      versionGoal: '1.0.0',
    }).should.be.false();

    // Patch or minor versions that occur later ARE compatible
    isVersionCompatible({
      versionCurrent: '1.0.0',
      versionGoal: '1.14.0',
    }).should.be.true();
    isVersionCompatible({
      versionCurrent: '1.0.0',
      versionGoal: '1.0.32',
    }).should.be.true();
    isVersionCompatible({
      versionCurrent: '1.5.0',
      versionGoal: '1.7.3',
    }).should.be.true();
    isVersionCompatible({
      versionCurrent: '2.0.0',
      versionGoal: '2.9.9',
    }).should.be.true();
  });
});
