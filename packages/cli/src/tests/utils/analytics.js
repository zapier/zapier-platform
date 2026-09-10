require('should');
const { getBinaryName, shouldSkipAnalytics } = require('../../utils/analytics');

describe('analytics', () => {
  // causes a lot of noise
  it('should not run analytics when testing', () => {
    shouldSkipAnalytics().should.be.true();
  });

  describe('getBinaryName', () => {
    const originalArgv = process.argv;
    const originalPlatform = process.platform;

    afterEach(() => {
      process.argv = originalArgv;
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    const stubPlatform = (value) => {
      Object.defineProperty(process, 'platform', { value });
    };

    it('returns "zapier" when invoked via the zapier symlink on Unix', () => {
      stubPlatform('linux');
      process.argv = ['/usr/bin/node', '/usr/local/bin/zapier', 'apps'];
      getBinaryName().should.equal('zapier');
    });

    it('returns "zapier-platform" when invoked via the new symlink on Unix', () => {
      stubPlatform('darwin');
      process.argv = ['/usr/bin/node', '/usr/local/bin/zapier-platform', 'apps'];
      getBinaryName().should.equal('zapier-platform');
    });

    it('strips the file extension if present', () => {
      stubPlatform('linux');
      process.argv = ['/usr/bin/node', '/usr/local/bin/zapier.js'];
      getBinaryName().should.equal('zapier');
    });

    it('returns undefined on Windows where both wrappers map to the same exe', () => {
      stubPlatform('win32');
      process.argv = ['C:\\Program Files\\nodejs\\node.exe', 'C:\\foo\\zapier'];
      (getBinaryName() === undefined).should.be.true();
    });

    it('returns undefined when argv[1] is missing', () => {
      stubPlatform('linux');
      process.argv = ['/usr/bin/node'];
      (getBinaryName() === undefined).should.be.true();
    });
  });
});
