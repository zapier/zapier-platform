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
        '## 4.0.0\n\n' +
          '### Changed\n\n' +
          'Switch changelog format\n' +
          '### Security\n' +
          'Update dependencies\n' +
          '### Fixes\n' +
          'No code, no issue\n' +
          '## 3.0.0\n\n' +
          'Made some changes that affect app actions\n' +
          '- Update the trigger/pr_review action, as well as changes for #456\n' +
          '1. Fix trigger/new_card #208\n' +
          '2. Update and fix search/find_contact #567\n' +
          "3. You're gonna like this - improvements to #89, #90, create/add_task and search/find_task\n" +
          '4. Add trigger/new_contact #10\n' +
          '5. New action! create/add_contact\n' +
          'However, we also addressed fixed open issues!\n' +
          '- Fix #123 and an issue with create/send_message\n\n' +
          '## new and improved version! (v2.0.0)\n\n' +
          '* Fix some bugs.\n' +
          '* Major docs fixes.\n\n' +
          '## 1.0.0\n\n' +
          '* Removing beta "label".\n' +
          '* Minor docs fixes.\n' +
          '# 0.0.1\n' +
          'initial release\n\n' +
          'just for internal testing\n\n',
      );
    });

    after(() => {
      fs.removeSync(appDir);
    });

    it('should be forgiving on the markdown format', async () => {
      const { appMetadata, issueMetadata, changelog } =
        await changelogUtil.getVersionChangelog('0.0.1', appDir);
      should(appMetadata).equal(undefined);
      should(issueMetadata).equal(undefined);
      changelog.should.equal('initial release\n\njust for internal testing');
    });

    it('should include subheads', async () => {
      const { appMetadata, issueMetadata, changelog } =
        await changelogUtil.getVersionChangelog('4.0.0', appDir);
      should(appMetadata).equal(undefined);
      should(issueMetadata).equal(undefined);
      changelog.should.equal(
        '### Changed\n\nSwitch changelog format\n### Security\nUpdate dependencies\n### Fixes\nNo code, no issue',
      );
    });

    it('should find changelog for 1.0.0', () =>
      changelogUtil.getVersionChangelog('1.0.0', appDir).then((log) => {
        log.changelog.should.eql(
          '* Removing beta "label".\n* Minor docs fixes.',
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
        'Made some changes that affect app actions\n' +
          '- Update the trigger/pr_review action, as well as changes for #456\n' +
          '1. Fix trigger/new_card #208\n' +
          '2. Update and fix search/find_contact #567\n' +
          "3. You're gonna like this - improvements to #89, #90, create/add_task and search/find_task\n" +
          '4. Add trigger/new_contact #10\n' +
          '5. New action! create/add_contact\n' +
          'However, we also addressed fixed open issues!\n' +
          '- Fix #123 and an issue with create/send_message',
      );
      appMetadata.should.deepEqual([
        {
          app_change_type: 'FEATURE_UPDATE',
          action_key: 'pr_review',
          action_type: 'read',
        },
        {
          app_change_type: 'BUGFIX',
          action_type: 'read',
          action_key: 'new_card',
        },

        // BUGFIX because "fix" is right next to search/find_contact, closer than "update"
        {
          app_change_type: 'BUGFIX',
          action_type: 'search',
          action_key: 'find_contact',
        },

        // The word "improve" doesn't have to be in the beginning of the sentence
        {
          app_change_type: 'FEATURE_UPDATE',
          action_type: 'write',
          action_key: 'add_task',
        },
        {
          app_change_type: 'FEATURE_UPDATE',
          action_type: 'search',
          action_key: 'find_task',
        },

        {
          app_change_type: 'FEATURE_UPDATE',
          action_type: 'read',
          action_key: 'new_contact',
        },

        {
          app_change_type: 'FEATURE_UPDATE',
          action_type: 'write',
          action_key: 'add_contact',
        },
        {
          app_change_type: 'BUGFIX',
          action_key: 'send_message',
          action_type: 'write',
        },
      ]);
      issueMetadata.should.deepEqual([
        { app_change_type: 'FEATURE_UPDATE', issue_id: 456 },
        { app_change_type: 'BUGFIX', issue_id: 208 },

        // BUGFIX because "fix" is closer to the issue ID
        { app_change_type: 'BUGFIX', issue_id: 567 },

        { app_change_type: 'FEATURE_UPDATE', issue_id: 89 },
        { app_change_type: 'FEATURE_UPDATE', issue_id: 90 },

        { app_change_type: 'FEATURE_UPDATE', issue_id: 10 },
        { app_change_type: 'BUGFIX', issue_id: 123 },
      ]);
    });
  });
});
