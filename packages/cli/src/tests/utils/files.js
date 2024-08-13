const os = require('os');
const path = require('path');
const should = require('should');
const files = require('../../utils/files');
const { listFiles } = require('../../utils/build');

describe('files', () => {
  let tmpDir;

  beforeEach((done) => {
    tmpDir = path.resolve(os.tmpdir(), 'zapier-platform-cli-files-test');
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

  it('should read and write files', (done) => {
    const fileName = path.resolve(tmpDir, 'read-write-test.txt');
    const data = '123';

    files
      .writeFile(fileName, data)
      .then(() =>
        files.readFile(fileName).then((buf) => {
          buf.toString().should.equal(data);
          done();
        })
      )
      .catch(done);
  });

  describe('copyDir', () => {
    let tmpDir, srcDir, dstDir;

    beforeEach(async () => {
      tmpDir = path.join(os.tmpdir(), 'zapier-platform-cli-copyDir-test');
      srcDir = path.join(tmpDir, 'src');
      dstDir = path.join(tmpDir, 'dst');

      await files.removeDir(srcDir);
      await files.ensureDir(srcDir);
      await files.writeFile(path.join(srcDir, '01.txt'), 'chapter 1');
      await files.writeFile(path.join(srcDir, '02.txt'), 'chapter 2');
      await files.ensureDir(path.join(srcDir, '03'));
      await files.writeFile(path.join(srcDir, '03', '03.txt'), 'chapter 3');
      await files.writeFile(path.join(srcDir, '03', 'cover.jpg'), 'image data');
      await files.writeFile(path.join(srcDir, '03', 'photo.jpg'), 'photo data');

      await files.removeDir(dstDir);
      await files.ensureDir(dstDir);
      await files.writeFile(path.join(dstDir, '01.txt'), 'ch 1');
      await files.writeFile(path.join(dstDir, '02.txt'), 'ch 2');
      await files.ensureDir(path.join(dstDir, '03'));
      await files.writeFile(path.join(dstDir, '03', '03.txt'), 'ch 3');
      await files.writeFile(path.join(dstDir, '03', 'cover.jpg'), 'old data');
      await files.writeFile(path.join(dstDir, '03', 'fig.png'), 'png data');
    });

    afterEach(async () => {
      await files.removeDir(tmpDir);
    });

    it('should copy a directory without clobber', async () => {
      // clobber defaults to false
      await files.copyDir(srcDir, dstDir);
      should.equal(
        await files.readFileStr(path.join(dstDir, '01.txt')),
        'ch 1'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', '03.txt')),
        'ch 3'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'fig.png')),
        'png data'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'photo.jpg')),
        'photo data'
      );
    });

    it('should copy a directory with clobber', async () => {
      await files.copyDir(srcDir, dstDir, { clobber: true });
      should.equal(
        await files.readFileStr(path.join(dstDir, '02.txt')),
        'chapter 2'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', '03.txt')),
        'chapter 3'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'cover.jpg')),
        'image data'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'fig.png')),
        'png data'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'photo.jpg')),
        'photo data'
      );
    });

    it('should copy a directory with onDirExists returning false', async () => {
      await files.copyDir(srcDir, dstDir, {
        clobber: true,
        onDirExists: () => false,
      });
      should.equal(
        await files.readFileStr(path.join(dstDir, '02.txt')),
        'chapter 2'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', '03.txt')),
        'ch 3'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'cover.jpg')),
        'old data'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'fig.png')),
        'png data'
      );
      files
        .fileExistsSync(path.join(dstDir, '03', 'photo.jpg'))
        .should.be.false();
    });

    it('should copy a directory with onDirExists deleting dir', async () => {
      await files.copyDir(srcDir, dstDir, {
        clobber: true,
        onDirExists: (dir) => {
          // Delete existing directory => completely overwrite the directory
          files.removeDirSync(dir);
          return true;
        },
      });
      should.equal(
        await files.readFileStr(path.join(dstDir, '01.txt')),
        'chapter 1'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', '03.txt')),
        'chapter 3'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'cover.jpg')),
        'image data'
      );
      should.equal(
        await files.readFileStr(path.join(dstDir, '03', 'photo.jpg')),
        'photo data'
      );
      files
        .fileExistsSync(path.join(dstDir, '03', 'fig.png'))
        .should.be.false();
    });
  });

  describe('validateFileExists', () => {
    it('should not reject when file exists', (done) => {
      files
        .validateFileExists(__filename)
        .then(() => done())
        .catch(done);
    });

    it('should reject with custom message when file does not exist', (done) => {
      files
        .validateFileExists('./i-do-not-exist.txt', 'Oh noes.')
        .then(() => {
          done('expected an error');
        })
        .catch((err) => {
          err.message.should.eql(
            ': File ./i-do-not-exist.txt not found. Oh noes.'
          );
          done();
        });
    });
  });

  describe('isEmptyDir', () => {
    it('should return true when directory is empty', (done) => {
      files
        .isEmptyDir(tmpDir)
        .then((isEmpty) => {
          isEmpty.should.eql(true);
          done();
        })
        .catch(done);
    });

    it('should return false when directory is not empty', (done) => {
      files
        .isEmptyDir(__dirname)
        .then((isEmpty) => {
          isEmpty.should.eql(false);
          done();
        })
        .catch(done);
    });

    it('should return reject when directory does not exist', (done) => {
      files
        .isEmptyDir('i-do-no-exist')
        .then(() => {
          done('expected an error');
        })
        .catch(() => {
          done();
        });
    });
  });
  it('getUnignoredFiles', async () => {
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

    const deletableFiles = new Set(
      await files.getUnignoredFiles(tmpDir, targetFiles)
    );

    should.equal(deletableFiles.has('.gitignore'), false);
    should.equal(deletableFiles.has('.env'), false);
    should.equal(deletableFiles.has('.secret.txt'), false);
    should.equal(deletableFiles.has('creds/creds.txt'), false);
    should.equal(deletableFiles.has('deletable_file.js'), true);
  });
});
