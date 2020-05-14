require('should');
const path = require('path');
const fs = require('fs-extra');
const changelog = require('../../utils/changelog');
const { makeTempDir } = require('../../utils/files');

describe('changelog utils', () => {
  describe('getVersionChangelog', () => {
    let appDir;

    before(() => {
      // Create a temp CHANGELOG.md
      appDir = makeTempDir();
      fs.writeFileSync(
        path.join(appDir, 'CHANGELOG.md'),
        '## new and improved version! (v2.0.0)\n\n' +
          '* Fix some bugs.\n' +
          '* Major docs fixes.\n\n' +
          '## 1.0.0\n\n' +
          '* Removing beta "label".\n' +
          '* Minor docs fixes.\n'
      );
    });

    after(() => {
      fs.removeSync(appDir);
    });

    it('should find changelog for 1.0.0', () =>
      changelog.getVersionChangelog('1.0.0', appDir).then((log) => {
        log.should.eql('* Removing beta "label".\n* Minor docs fixes.');
      }));

    it('should not find changelog for 2.3.0', () =>
      changelog.getVersionChangelog('2.3.0', appDir).then((log) => {
        log.should.eql('');
      }));

    it('should not fail when there is no changelog file', () =>
      changelog
        .getVersionChangelog('1.0.0', './unexistent-directory')
        .then((log) => {
          log.should.eql('');
        }));

    it('should not fail when versions follow "different" formatting', () =>
      changelog.getVersionChangelog('2.0.0', appDir).then((log) => {
        log.should.eql('* Fix some bugs.\n* Major docs fixes.');
      }));
  });
});
