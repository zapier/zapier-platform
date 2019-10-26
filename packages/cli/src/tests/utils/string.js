require('should');
const string = require('../../utils/string');

describe('string utils', () => {
  describe('splitFileFromPath', () => {
    it('returns the file and location from a path', () => {
      const [filename, dir] = string.splitFileFromPath(
        'src/triggers/new_issue'
      );
      filename.should.equal('new_issue.js');
      dir.should.equal('src/triggers');
    });

    it('uses a given suffix', () => {
      const [filename, dir] = string.splitFileFromPath(
        'src/triggers/new_issue',
        'test.js'
      );
      filename.should.equal('new_issue.test.js');
      dir.should.equal('src/triggers');
    });
  });
});
