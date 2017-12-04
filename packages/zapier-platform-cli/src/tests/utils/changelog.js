require('should');
const changelog = require('../../utils/changelog');

describe('changelog utils', () => {

  describe('getVersionChangelog', () => {

    it('should find changelog for 1.0.0', () =>
      changelog.getVersionChangelog('1.0.0')
        .then((log) => {
          log.should.eql('* Removing beta "label".\n* Minor docs fixes.');
        })
    );

    it('should not find changelog for 2.3.0', () =>
      changelog.getVersionChangelog('2.3.0')
        .then((log) => {
          log.should.eql('');
        })
    );

    it('should not fail when there is no changelog file', () =>
      changelog.getVersionChangelog('1.0.0', './unexistent-directory')
        .then((log) => {
          log.should.eql('');
        })
    );

  });

});
