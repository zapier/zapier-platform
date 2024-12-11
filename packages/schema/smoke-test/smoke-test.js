const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');
const fetch = require('node-fetch');

const npmPack = () => {
  let filename;
  const proc = spawnSync('npm', ['pack'], { encoding: 'utf8' });
  const lines = proc.stdout.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      filename = line;
      break;
    }
  }
  return filename;
};

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

const npmInstall = (packagePath, workdir) => {
  spawnSync('npm', ['install', packagePath], {
    encoding: 'utf8',
    cwd: workdir,
  });
};

const copyTestScript = (filename, workdir) => {
  const dest = path.join(workdir, filename);
  fs.copyFileSync(path.join(__dirname, filename), dest);
  return dest;
};

describe('smoke tests - setup will take some time', () => {
  const context = {
    // Global context that will be available for all test cases in this test suite
    package: {
      filename: null,
      path: null,
    },
    workdir: null,
    testScripts: {
      validate: null,
      export: null,
    },
  };

  before(() => {
    context.package.filename = npmPack();
    context.package.path = path.join(process.cwd(), context.package.filename);

    context.workdir = setupTempWorkingDir();

    npmInstall(context.package.path, context.workdir);

    context.testScripts.validate = copyTestScript(
      'test-validate',
      context.workdir,
    );
    context.testScripts.export = copyTestScript('test-export', context.workdir);
    console.log('setup complete!');
  });

  after(() => {
    fs.unlinkSync(context.package.path);
    fs.removeSync(context.workdir);
  });

  it('package size should not change much', async function () {
    const baseUrl = 'https://registry.npmjs.org/zapier-platform-schema';
    let res = await fetch(baseUrl);
    const packageInfo = await res.json();
    const latestVersion = packageInfo['dist-tags'].latest;

    res = await fetch(
      `${baseUrl}/-/zapier-platform-schema-${latestVersion}.tgz`,
    );
    const baselineSize = res.headers.get('content-length');
    const newSize = fs.statSync(context.package.path).size;
    newSize.should.be.within(baselineSize * 0.7, baselineSize * 1.3);

    this.test.title += ` (${baselineSize} -> ${newSize} bytes)`;
  });

  it('should to able to validate app definitions', () => {
    const proc = spawnSync(context.testScripts.validate, {
      encoding: 'utf8',
      cwd: context.workdir,
    });
    const results = JSON.parse(proc.stdout);
    results.length.should.eql(2);
    results[0].length.should.eql(0);
    results[1].length.should.eql(2);
    results[1][0].should.eql('requires property "version"');
    results[1][1].should.eql('requires property "platformVersion"');
  });

  it('exported-schema.json should exist and be up-to-date', () => {
    const exportedSchemaPath = path.join(
      context.workdir,
      'node_modules',
      'zapier-platform-schema',
      'exported-schema.json',
    );
    fs.existsSync(exportedSchemaPath).should.be.true();

    const content = fs.readFileSync(exportedSchemaPath, { encoding: 'utf8' });
    const schemaInPackage = JSON.parse(content);

    const proc = spawnSync(context.testScripts.export, {
      encoding: 'utf8',
      cwd: context.workdir,
    });
    const expectedSchema = JSON.parse(proc.stdout);

    schemaInPackage.should.eql(
      expectedSchema,
      'exported-schema.json is not up-to-date. Try `npm run export`.',
    );
  });
});
