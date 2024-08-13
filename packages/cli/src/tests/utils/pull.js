const os = require('os');
const path = require('path');
const should = require('should');
const files = require('../../utils/files');
const { deleteUnignoredFiles } = require('../../utils/pull');
const { listFiles } = require('../../utils/build');

describe('pull', () => {
  let tmpDir;

  beforeEach((done) => {
    tmpDir = path.resolve(os.tmpdir(), 'zapier-platform-cli-pull-test');
    files
      .removeDir(tmpDir)
      .then(() => files.ensureDir(tmpDir))
      .then(() => done())
      .catch(done);
  });

  afterEach((done) => {
    files
      .removeDir(tmpDir)
      .then(() => done())
      .catch(done);
  });

  it('deletes files that are not ignored', async () => {
    const fileAndData = [
      {
        name: '.gitignore',
        data: 'secret.txt\ncreds/*',
      },
      {
        name: '.env',
        data: 'SECRET=123\nKEY=456',
      },
      {
        name: 'deletable_file.js',
        data: 'console.log("deletable")',
      },
      {
        name: 'secret.txt',
        data: 'shh',
      },
    ];

    // Adding a directory with a file to be ignored from deletion
    const credsDir = path.join(tmpDir, 'creds');
    await files.ensureDir(credsDir);
    await files.writeFile(path.join(credsDir, 'creds.txt'), 'password=123');

    for (const { name, data } of fileAndData) {
      const fileName = path.join(tmpDir, name);
      await files.writeFile(fileName, data);
    }
    const targetFiles = await listFiles(tmpDir);

    targetFiles.should.containEql('secret.txt');
    targetFiles.should.containEql('deletable_file.js');
    targetFiles.should.containEql('creds/creds.txt');

    await deleteUnignoredFiles(tmpDir, targetFiles);

    should.exist(files.fileExistsSync(path.join(tmpDir, '.gitignore')));
    should.exist(files.fileExistsSync(path.join(tmpDir, '.env')));
    should.exist(files.fileExistsSync(path.join(tmpDir, 'secret.txt')));
    should.exist(files.fileExistsSync(path.join(tmpDir, 'creds', 'creds.txt')));
    should.equal(
      files.fileExistsSync(path.join(tmpDir, 'deletable_file.js')),
      false
    );
  });
});
