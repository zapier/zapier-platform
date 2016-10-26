require('should');

const path = require('path');

const build = require('../../utils/build');

const fs = require('fs');

const entryDir = fs.realpathSync(path.resolve(__dirname, '../../..'));
const entryPoint = path.resolve(__dirname, '../../../zapier.js');

describe('build', () => {

  it('should list only required files', (done) => {
    build.requiredFiles(entryDir, [entryPoint])
      .then((smartPaths) => {
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

  it('should list all the files', (done) => {
    build.listFiles(entryDir)
      .then((dumbPaths) => {
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

});
