require('should');
const files = require('../../utils/files');

const path = require('path');
const os = require('os');

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

  // TODO: this is broken in travis - works locally though
  it.skip('should copy a directory', (done) => {
    const srcDir = os.tmpdir();
    const srcFileName = path.resolve(srcDir, 'read-write-test.txt');
    const dstDir = path.resolve(srcDir, 'zapier-platform-cli-test-dest-dir');
    const dstFileName = path.resolve(dstDir, 'read-write-test.txt');
    const data = '123';

    files
      .writeFile(srcFileName, data)
      .then(files.copyDir(srcDir, dstDir))
      .then(() =>
        files.readFile(dstFileName).then((buf) => {
          buf.toString().should.equal(data);
          done();
        })
      )
      .catch((err) => {
        console.log('error', err);
        done(err);
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
});
