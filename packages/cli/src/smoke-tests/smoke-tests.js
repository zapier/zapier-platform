const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { promisify } = require('util');

require('should');

const { getPackageLatestVersion, getPackageSize } = require('../utils/npm');
const { ensureDir, makeTempDir } = require('../utils/files');
const { runCommand, npmPackCore } = require('../tests/_helpers');
const { PLATFORM_PACKAGE } = require('../constants');

const REGEX_VERSION = /\d+\.\d+\.\d+/;

const sleep = promisify(setTimeout);

const setupZapierRC = () => {
  let hasRC = false;
  const rcPath = path.join(os.homedir(), '.zapierrc');
  if (fs.existsSync(rcPath)) {
    hasRC = true;
  } else if (process.env.ZAPIER_DEPLOY_KEY) {
    fs.writeFileSync(
      rcPath,
      JSON.stringify({ deployKey: process.env.ZAPIER_DEPLOY_KEY }),
    );
    hasRC = true;
  }

  return hasRC;
};

const npmPackCLI = () => {
  let filename;
  const lines = runCommand('npm', ['pack']).split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line) {
      filename = line;
      break;
    }
  }
  return filename;
};

const npmInstall = (packagePath, workdir) => {
  runCommand('npm', ['install', '--production', packagePath], {
    cwd: workdir,
  });
};

const yarnInstall = (coreZipPath, workdir) => {
  // When releasing a new core version, example apps would have bumped their
  // core before the new core version is published to npm. So we need to patch
  // example app's package.json to use local core temporarily to avoid `npm
  // install` error.
  const packageJsonPath = path.join(workdir, 'package.json');
  const origPackageJsonText = fs.readFileSync(packageJsonPath);
  const packageJson = JSON.parse(origPackageJsonText);
  packageJson.dependencies[PLATFORM_PACKAGE] = `file:${coreZipPath}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

  try {
    runCommand('yarn', [], { cwd: workdir });
  } finally {
    fs.writeFileSync(packageJsonPath, origPackageJsonText);
  }
};

describe('smoke tests - setup will take some time', function () {
  this.retries(3);

  const context = {
    // Global context that will be available for all test cases in this test suite
    package: {
      filename: null,
      version: null,
      path: null,
    },
    workdir: null,
    cliBin: null,
    hasRC: false,
  };

  before(() => {
    context.hasRC = setupZapierRC();

    context.package.filename = npmPackCLI();
    context.package.version = context.package.filename.match(REGEX_VERSION)[0];
    context.package.path = path.join(process.cwd(), context.package.filename);

    context.workdir = makeTempDir();

    npmInstall(context.package.path, context.workdir);

    context.cliBin = path.join(
      context.workdir,
      'node_modules',
      '.bin',
      'zapier',
    );
  });

  after(() => {
    fs.unlinkSync(context.package.path);
    fs.removeSync(context.workdir);
  });

  beforeEach(async function () {
    // delay after first failure
    const currentRetry = this.currentTest.currentRetry();
    if (currentRetry > 0) {
      await sleep(Math.pow(2, currentRetry) * 1000);
    }
  });

  afterEach(function () {
    const currentRetry = this.currentTest.currentRetry();
    if (currentRetry >= 0) {
      this.currentTest.title += ` (${currentRetry} retries)`;
    }
  });

  it('package size should not change much', async function () {
    const packageName = 'zapier-platform-cli';
    const latestVersion = await getPackageLatestVersion(packageName);
    const baselineSize = await getPackageSize(packageName, latestVersion);
    const newSize = fs.statSync(context.package.path).size;
    newSize.should.be.within(baselineSize * 0.7, baselineSize * 1.3);

    this.test.title += ` (${baselineSize} -> ${newSize} bytes)`;
  });

  it('cli executable should exist', () => {
    fs.existsSync(context.cliBin).should.be.true();
  });

  it('zapier --version', () => {
    const versionOutput = runCommand(context.cliBin, ['--version']);
    versionOutput
      .includes(`CLI version: ${context.package.version}`)
      .should.be.true();
  });

  it('zapier init -t minimal', () => {
    runCommand(context.cliBin, ['init', 'awesome-app', '-t', 'minimal'], {
      cwd: context.workdir,
    });

    const newAppDir = path.join(context.workdir, 'awesome-app');
    fs.existsSync(newAppDir).should.be.true();

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();
  });

  it('zapier init -t minimal -m esm', () => {
    runCommand(
      context.cliBin,
      ['init', 'awesome-esm-app', '-t', 'minimal', '-m', 'esm'],
      {
        cwd: context.workdir,
      },
    );

    const newAppDir = path.join(context.workdir, 'awesome-esm-app');
    fs.existsSync(newAppDir).should.be.true();

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    // TODO add a check for the module type
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();

    const pkg = JSON.parse(
      fs.readFileSync(appPackageJson, { encoding: 'utf8' }),
    );
    pkg.name.should.containEql('awesome-esm-app');
    pkg.type.should.containEql('module');
    pkg.exports.import.should.containEql('./index.js');
    pkg.exports.require.should.containEql('./index.js');
  });

  it('zapier scaffold trigger neat (JS)', () => {
    runCommand(context.cliBin, ['init', 'scaffold-town', '-t', 'minimal'], {
      cwd: context.workdir,
    });

    const newAppDir = path.join(context.workdir, 'scaffold-town');
    fs.existsSync(newAppDir).should.be.true();

    // npm install was already run, so it'll run the validaion function
    runCommand(context.cliBin, ['scaffold', 'trigger', 'neat'], {
      cwd: newAppDir,
    });

    const appIndexJs = path.join(newAppDir, 'index.js');
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appIndexJs).should.be.true();
    fs.existsSync(appPackageJson).should.be.true();

    const newTrigger = path.join(newAppDir, 'triggers', 'neat.js');
    fs.existsSync(newTrigger).should.be.true();

    const newTriggerTest = path.join(
      newAppDir,
      'test',
      'triggers',
      'neat.test.js',
    );
    fs.existsSync(newTriggerTest).should.be.true();

    const pkg = JSON.parse(
      fs.readFileSync(appPackageJson, { encoding: 'utf8' }),
    );
    pkg.name.should.containEql('scaffold-town');
  });

  it('zapier scaffold trigger neat (TS)', () => {
    runCommand(
      context.cliBin,
      ['init', 'scaffold-town-ts', '-t', 'typescript'],
      { cwd: context.workdir },
    );

    const newAppDir = path.join(context.workdir, 'scaffold-town-ts');
    fs.existsSync(newAppDir).should.be.true();

    runCommand(context.cliBin, ['scaffold', 'trigger', 'neat'], {
      cwd: newAppDir,
    });

    const appIndexTs = path.join(newAppDir, 'src', 'index.ts');
    fs.existsSync(appIndexTs).should.be.true();
    const appPackageJson = path.join(newAppDir, 'package.json');
    fs.existsSync(appPackageJson).should.be.true();

    const triggerPath = path.join(newAppDir, 'src', 'triggers', 'neat.ts');
    fs.existsSync(triggerPath).should.be.true();

    const newTriggerTest = path.join(
      newAppDir,
      'src',
      'test',
      'triggers',
      'neat.test.ts',
    );
    fs.existsSync(newTriggerTest).should.be.true();

    const pkg = JSON.parse(
      fs.readFileSync(appPackageJson, { encoding: 'utf8' }),
    );
    pkg.name.should.containEql('scaffold-town');
  });

  it('zapier integrations', function () {
    if (!context.hasRC) {
      this.skip();
      return;
    }
    const stdout = runCommand(context.cliBin, [
      'integrations',
      '--format=json',
    ]);
    const result = JSON.parse(stdout);
    result.should.be.Array();
  });

  describe('zapier init w/ templates (runs very slowly)', () => {
    const testableTemplates = [
      'basic-auth',
      'custom-auth',
      'digest-auth',
      // 'oauth1-trello',
      'oauth2',
      'session-auth',

      'dynamic-dropdown',
      'files',
      'minimal',
      'search-or-create',
      'typescript',
    ];

    const invokeCommandsByTemplate = {
      // Add an entry here if you want to test a template with an invoke
      // command. The object key is the template name, and the value is an array
      // of objects. Each object represents an invoke command and a "verify"
      // function. The commands will be run sequentially so later ones will be
      // influenced by the earlier ones. Each object consists of:
      // - files (optional): files to write before running the command
      // - command: command args to pass to spawnSync()
      // - options (optional): options to pass to spawnSync()
      // - verify: a function that takes the output and asserts something
      oauth2: [
        {
          files: [
            {
              name: '.env',
              content:
                'CLIENT_ID=1234\n' +
                'CLIENT_SECRET=asdf\n' +
                'authData_access_token=a_token\n' +
                'authData_refresh_token=a_refresh_token\n',
            },
          ],
          command: ['invoke', 'auth', 'test', '--non-interactive'],
          verify: (output, appDir) => {
            const testResult = JSON.parse(output);
            testResult.json.username.should.eql('Bret');
            testResult.json.email.should.eql('Sincere@april.biz');
          },
        },
        {
          command: ['invoke', 'auth', 'refresh', '--non-interactive'],
          verify: (output, appDir) => {
            const envPath = path.join(appDir, '.env');
            const envContent = fs.readFileSync(envPath, { encoding: 'utf8' });
            // The refresh command should append a new access token at the end
            envContent.should.eql(
              'CLIENT_ID=1234\n' +
                'CLIENT_SECRET=asdf\n' +
                'authData_access_token=a_token\n' +
                'authData_refresh_token=a_refresh_token\n' +
                "authData_access_token='a_token'\n",
            );
          },
        },
      ],
      'dynamic-dropdown': [
        {
          command: [
            'invoke',
            'trigger',
            'people',
            '-i',
            '{"species_id":"1"}',
            '--non-interactive',
          ],
          verify: (output, appDir) => {
            const people = JSON.parse(output);
            const firstPerson = people[0];
            firstPerson.id.should.eql(1);
            firstPerson.name.should.eql('Luke Skywalker');
          },
        },
      ],
      'search-or-create': [
        {
          files: [
            {
              name: 'recipe.json',
              content: '{"name":"name 3"}',
            },
          ],
          command: [
            'invoke',
            'search',
            'recipe',
            '--inputData',
            '@recipe.json',
            '--non-interactive',
          ],
          verify: (output, appDir) => {
            const recipes = JSON.parse(output);
            recipes.length.should.eql(1);
            recipes[0].name.should.eql('name 3');
          },
        },
        {
          command: [
            'invoke',
            'create',
            'recipe',
            '--inputData',
            '@-', // read from stdin
          ],
          options: {
            input: '{"name":"Pizza"}',
          },
          verify: (output, appDir) => {
            const recipe = JSON.parse(output);
            recipe.name.should.eql('Pizza');
          },
        },
      ],
    };

    const subfolder = 'template-tests';
    let subfolderPath, corePackage;

    before(async () => {
      subfolderPath = path.join(context.workdir, subfolder);
      await ensureDir(subfolderPath);
      corePackage = await npmPackCore();
    });

    after(() => {
      corePackage.cleanup();
    });

    testableTemplates.forEach((template) => {
      it(`${template} should test out of the box`, function () {
        this.retries(3); // retry up to 3 times

        runCommand(context.cliBin, ['init', template, '-t', template], {
          cwd: subfolderPath,
          input: 'a', // tells `yo` to replace the auth file
        });

        const appDir = path.join(subfolderPath, template);
        yarnInstall(corePackage.path, appDir);

        // should not throw an error
        runCommand(context.cliBin, ['test', '--skip-validate'], {
          cwd: appDir,
        });

        const invokeCommands = invokeCommandsByTemplate[template];
        if (!invokeCommands) {
          return;
        }

        const envPath = path.join(appDir, '.env');
        fs.existsSync(envPath) && fs.unlinkSync(envPath);

        // Test with invoke command
        for (const { files, command, options, verify } of invokeCommands) {
          if (files && files.length) {
            for (const { name, content } of files) {
              const filePath = path.join(appDir, name);
              fs.writeFileSync(filePath, content);
            }
          }
          const output = runCommand(context.cliBin, command, {
            cwd: appDir,
            ...options,
          });
          verify(output, appDir);
        }
      });
    });
  });
});
