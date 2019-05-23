const should = require('should');

const crypto = require('crypto');
const os = require('os');
const path = require('path');

const build = require('../../utils/build');

const decompress = require('decompress');
const fs = require('fs');
const fse = require('fs-extra');

const entryDir = fs.realpathSync(path.resolve(__dirname, '../../..'));
const entryPoint = path.resolve(__dirname, '../../../zapier.js');

describe('build', () => {
  it('should list only required files', () => {
    return build.requiredFiles(entryDir, [entryPoint]).then(smartPaths => {
      // check that only the required lodash files are grabbed
      smartPaths
        .filter(filePath => filePath.indexOf('node_modules/lodash') === 0)
        .length.should.be.within(0, 2);
      smartPaths.should.containEql('node_modules/lodash/lodash.js');
      smartPaths.should.containEql('src/commands/init.js');
      smartPaths.should.not.containEql('README.md');
    });
  });

  it('should list all the files', () => {
    return build.listFiles(entryDir).then(dumbPaths => {
      // check that way more than the required lodash files are grabbed
      dumbPaths
        .filter(filePath => filePath.indexOf('node_modules/lodash') === 0)
        .length.should.be.within(800, 1200);
      dumbPaths.should.containEql('node_modules/lodash/lodash.js');
      dumbPaths.should.containEql('src/commands/init.js');
      dumbPaths.should.containEql('README.md');
    });
  });

  it('list should not include blacklisted files', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );

    [
      'safe.js',
      '.env',
      '.environment',
      '.git/HEAD',
      'build/the-build.zip'
    ].forEach(file => {
      const fileDir = file.split(path.sep);
      fileDir.pop();
      if (fileDir.length > 0) {
        fse.ensureDirSync(path.join(tmpProjectDir, fileDir.join(path.sep)));
      }
      fse.outputFileSync(path.join(tmpProjectDir, file), 'the-file');
    });

    return build.listFiles(tmpProjectDir).then(dumbPaths => {
      dumbPaths.should.containEql('safe.js');
      dumbPaths.should.not.containEql('.env');
      dumbPaths.should.not.containEql('build/the-build.zip');
      dumbPaths.should.not.containEql('.environment');
      dumbPaths.should.not.containEql('.git/HEAD');
    });
  });

  it('should error over futurejs files', () => {
    should(() => {
      build.verifyNodeFeatures([path.join(entryDir, 'snippets', 'next.js')]);
    }).throw(Error);
  });

  it('should not error over regular files', () => {
    build.verifyNodeFeatures([entryPoint]).should.deepEqual([entryPoint]);
  });

  it('should make a build.zip', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'build.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(path.join(tmpProjectDir, '.zapierapprc'), '{}');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(2);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner'
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group'
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public'
        );
      });
  });

  it('should make a source.zip without .gitignore', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'source.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fse.outputFileSync(tmpReadmePath, 'README');
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(tmpZapierAppPath, '{}');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(4);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);
        (indexFile.mode & 0o400).should.be.above(
          0,
          'no read permission for owner'
        );
        (indexFile.mode & 0o040).should.be.above(
          0,
          'no read permission for group'
        );
        (indexFile.mode & 0o004).should.be.above(
          0,
          'no read permission for public'
        );

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md'
        );
        should.exist(readmeFile);
      });
  });

  it('should make a source.zip with .gitignore', () => {
    const osTmpDir = fse.realpathSync(os.tmpdir());
    const tmpProjectDir = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpZipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex'),
      'source.zip'
    );
    const tmpUnzipPath = path.join(
      osTmpDir,
      'zapier-' + crypto.randomBytes(4).toString('hex')
    );
    const tmpIndexPath = path.join(tmpProjectDir, 'index.js');
    const tmpReadmePath = path.join(tmpProjectDir, 'README.md');
    const tmpZapierAppPath = path.join(tmpProjectDir, '.zapierapprc');
    const tmpGitIgnorePath = path.join(tmpProjectDir, '.gitignore');
    const tmpTestLogPath = path.join(tmpProjectDir, 'test.log');
    const tmpDSStorePath = path.join(tmpProjectDir, '.DS_Store');
    const tmpEnvironmentPath = path.join(tmpProjectDir, '.environment');

    fse.outputFileSync(
      path.join(tmpProjectDir, 'zapierwrapper.js'),
      "console.log('hello!')"
    );
    fse.outputFileSync(tmpIndexPath, "console.log('hello!')");
    fs.chmodSync(tmpIndexPath, 0o700);
    fse.outputFileSync(tmpReadmePath, 'README');
    fse.outputFileSync(tmpZapierAppPath, '{}');
    fse.outputFileSync(tmpGitIgnorePath, '.DS_Store\n*.log');
    fse.outputFileSync(tmpTestLogPath, 'Something');
    fse.outputFileSync(tmpDSStorePath, 'Something Else');
    fse.outputFileSync(tmpEnvironmentPath, 'ZAPIER_TOKEN=YEAH');
    fse.ensureDirSync(path.dirname(tmpZipPath));

    global.argOpts = {};

    return build
      .makeSourceZip(tmpProjectDir, tmpZipPath)
      .then(() => decompress(tmpZipPath, tmpUnzipPath))
      .then(files => {
        files.length.should.equal(4);

        const indexFile = files.find(
          ({ path: filePath }) => filePath === 'index.js'
        );
        should.exist(indexFile);

        const readmeFile = files.find(
          ({ path: filePath }) => filePath === 'README.md'
        );
        should.exist(readmeFile);

        const gitIgnoreFile = files.find(
          ({ path: filePath }) => filePath === '.gitignore'
        );
        should.not.exist(gitIgnoreFile);

        const testLogFile = files.find(
          ({ path: filePath }) => filePath === 'test.log'
        );
        should.not.exist(testLogFile);

        const DSStoreFile = files.find(
          ({ path: filePath }) => filePath === '.DS_Store'
        );
        should.not.exist(DSStoreFile);

        const environmentFile = files.find(
          ({ path: filePath }) => filePath === '.environment'
        );
        should.not.exist(environmentFile);
      });
  });
});
