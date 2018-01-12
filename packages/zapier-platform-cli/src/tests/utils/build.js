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
  it('should list only required files', done => {
    build
      .requiredFiles(entryDir, [entryPoint])
      .then(smartPaths => {
        // check that only the required lodash files are grabbed
        smartPaths
          .filter(filePath => filePath.indexOf('node_modules/lodash') === 0)
          .length.should.be.within(0, 2);
        smartPaths.should.containEql('node_modules/lodash/lodash.js');
        smartPaths.should.containEql('lib/commands/init.js');
        smartPaths.should.not.containEql('src/commands/init.js');
        smartPaths.should.not.containEql('README.md');
        done();
      })
      .catch(done);
  });

  it('should list all the files', done => {
    build
      .listFiles(entryDir)
      .then(dumbPaths => {
        // check that way more than the required lodash files are grabbed
        dumbPaths
          .filter(filePath => filePath.indexOf('node_modules/lodash') === 0)
          .length.should.be.within(800, 1200);
        dumbPaths.should.containEql('node_modules/lodash/lodash.js');
        dumbPaths.should.containEql('lib/commands/init.js');
        dumbPaths.should.containEql('src/commands/init.js');
        dumbPaths.should.containEql('README.md');
        done();
      })
      .catch(done);
  });

  it('should make a zip', done => {
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

    build
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

        done();
      })
      .catch(done);
  });
});
