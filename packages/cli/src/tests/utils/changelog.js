const should = require('should');
const path = require('path');
const fs = require('fs-extra');
const changelogUtil = require('../../utils/changelog');
const { makeTempDir } = require('../../utils/files');

describe('changelog utils', () => {
  describe('getVersionChangelog', () => {
    let appDir;

    before(() => {
      // Create a temp CHANGELOG.md
      appDir = makeTempDir();
      fs.writeFileSync(
        path.join(appDir, 'CHANGELOG.md'),
        '## 3.0.0\n\n' +
          'Made some changes that affect app actions\n' +
          '- Update the trigger/pr_review action, as well as changes for #456\n' +
          'However, we also addressed fixed open issues!\n' +
          '- Fix #123 and an issue with create/send_message\n\n' +
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
      changelogUtil.getVersionChangelog('1.0.0', appDir).then((log) => {
        log.changelog.should.eql(
          '* Removing beta "label".\n* Minor docs fixes.'
        );
      }));

    it('should not find changelog for 2.3.0', () =>
      changelogUtil.getVersionChangelog('2.3.0', appDir).then((log) => {
        log.changelog.should.eql('');
      }));

    it('should not fail when there is no changelog file', () =>
      changelogUtil
        .getVersionChangelog('1.0.0', './unexistent-directory')
        .then((log) => {
          log.changelog.should.eql('');
        }));

    it('should not fail when versions follow "different" formatting', () =>
      changelogUtil.getVersionChangelog('2.0.0', appDir).then((log) => {
        log.changelog.should.eql('* Fix some bugs.\n* Major docs fixes.');
      }));

    it('should not return metadata if it is not found', async () => {
      const { appMetadata, issueMetadata, changelog } =
        await changelogUtil.getVersionChangelog('1.0.0', appDir);
      should(appMetadata).equal(undefined);
      should(issueMetadata).equal(undefined);
      changelog.should.equal('* Removing beta "label".\n* Minor docs fixes.');
    });

    it('should return metadata if it is found', async () => {
      const { appMetadata, issueMetadata, changelog } =
        await changelogUtil.getVersionChangelog('3.0.0', appDir);

      changelog.should.equal(
        'Made some changes that affect app actions\n- Update the trigger/pr_review action, as well as changes for #456\nHowever, we also addressed fixed open issues!\n- Fix #123 and an issue with create/send_message'
      );
      appMetadata.should.deepEqual([
        {
          app_change_type: 'FEATURE_UPDATE',
          action_key: 'pr_review',
          action_type: 'read',
        },
        {
          app_change_type: 'BUGFIX',
          action_key: 'send_message',
          action_type: 'write',
        },
      ]);
      issueMetadata.should.deepEqual([
        { app_change_type: 'FEATURE_UPDATE', issue_id: 456 },
        { app_change_type: 'BUGFIX', issue_id: 123 },
      ]);
    });
  });
});
