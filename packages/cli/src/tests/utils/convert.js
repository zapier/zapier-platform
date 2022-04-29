const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { cloneDeep } = require('lodash');
const should = require('should');

const { convertApp } = require('../../utils/convert');

const visualAppDefinition = {
  platformVersion: '8.0.1',
  creates: {
    create_project: {
      operation: {
        perform: {
          body: {
            name: '{{bundle.inputData.name}}',
            public: '{{bundle.inputData.public}}',
          },
          url: 'https://api.wistia.com/v1/projects.json',
          removeMissingValuesFrom: {},
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer {{bundle.authData.access_token}}',
            Accept: 'application/json',
          },
          params: {},
          method: 'POST',
        },
        inputFields: [
          {
            required: true,
            list: false,
            label: 'Project Name',
            key: 'name',
            type: 'string',
            altersDynamicFields: false,
          },
          {
            required: false,
            list: false,
            label: 'Public?',
            key: 'public',
            type: 'boolean',
            altersDynamicFields: false,
          },
          {
            source:
              "// Configure a request to an endpoint of your api that\n// returns custom field meta data for the authenticated\n// user.  Don't forget to congigure authentication!\n\nconst options = {\n  url: 'https://api.example.com/custom_field_meta_data',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // modify your api response to return an array of Field objects\n    // see https://zapier.github.io/zapier-platform-schema/build/schema.html#fieldschema\n    // for schema definition.\n\n    return results;\n  });\n",
          },
          {
            source:
              "// Configure a request to an endpoint of your api that\n// returns custom field meta data for the authenticated\n// user.  Don't forget to congigure authentication!\n\nconst options = {\n  url: 'https://api.example.com/custom_field_meta_data',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // modify your api response to return an array of Field objects\n    // see https://zapier.github.io/zapier-platform-schema/build/schema.html#fieldschema\n    // for schema definition.\n\n    return results;\n  });\n",
          },
          {
            required: false,
            altersDynamicFields: false,
            children: [
              {
                required: false,
                list: false,
                label: 'q',
                key: 'q',
                type: 'string',
                altersDynamicFields: false,
              },
              {
                required: false,
                list: false,
                label: 'w',
                key: 'w',
                type: 'string',
                altersDynamicFields: false,
              },
            ],
            key: 'tickets',
            label: 'things',
          },
        ],
      },
      noun: 'Project',
      display: {
        hidden: false,
        important: true,
        description: 'asdfasda asdf asd fasd f',
        label: 'Create a New Project',
      },
      key: 'create_project',
    },
  },
  authentication: {
    test: {
      body: {},
      url: 'https://api.wistia.com/v1/account.json',
      removeMissingValuesFrom: {},
      headers: {
        Authorization: 'Bearer {{bundle.authData.access_token}}',
      },
      params: {},
      method: 'GET',
    },
    oauth2Config: {
      authorizeUrl: {
        url: 'https://app.wistia.com/oauth/authorize?client_id=03e84930b97011c7bd674f6d02c04ec9c1a430325a73a0501eb443ef07b6b99c&redirect_uri=https%3A%2F%2Fzapier.com%2Fdashboard%2Fauth%2Foauth%2Freturn%2FApp17741CLIAPI%2F&response_type=code',
        params: {
          state: '{{bundle.inputData.state}}',
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          response_type: 'code',
          client_id: '{{process.env.CLIENT_ID}}',
        },
        method: 'GET',
      },
      refreshAccessToken: {
        body: {
          grant_type: 'refresh_token',
          refresh_token: '{{bundle.authData.refresh_token}}',
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        method: 'POST',
      },
      getAccessToken: {
        body: {
          redirect_uri: '{{bundle.inputData.redirect_uri}}',
          client_secret: '{{process.env.CLIENT_SECRET}}',
          code: '{{bundle.inputData.code}}',
          client_id: '{{process.env.CLIENT_ID}}',
          grant_type: 'authorization_code',
        },
        url: 'https://api.wistia.com/oauth/token',
        removeMissingValuesFrom: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        params: {},
        method: 'POST',
      },
    },
    type: 'oauth2',
    connectionLabel: '{{name}}',
  },
  version: '1.0.1',
  triggers: {
    project: {
      operation: {
        perform: {
          body: {},
          url: 'https://api.wistia.com/v1/projects.json',
          removeMissingValuesFrom: {},
          headers: {
            Authorization: 'Bearer {{bundle.authData.access_token}}',
            Accept: 'application/json',
          },
          params: { sort_direction: '0', sort_by: 'created' },
          method: 'GET',
        },
      },
      noun: 'Project',
      display: {
        directions: 'this is help text, where does it go?',
        hidden: false,
        important: true,
        description: 'Triggers on a new project created',
        label: 'New Project',
      },
      key: 'project',
    },
    codemode: {
      operation: {
        perform: {
          source:
            "const options = {\n  url: 'https://jsonplaceholder.typicode.com/posts',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n    '_limit': '3'\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // You can do any parsing you need for results here before returning them\n\n    return results;\n  });",
        },
      },
      noun: 'Code',
      display: {
        hidden: false,
        important: true,
        description: "just runs some code, let's go",
        label: 'New Code Trigger',
      },
      key: 'codemode',
    },
  },
};

const visualApp = {
  latest_core_version: '8.0.1',
  image: null,
  early_access: false,
  id: 17741,
  invite_url:
    'https://zapier.com/developer/public-invite/17741/cf2bab685c2901fafb946b22f369f89f/',
  stats: {
    Auth: {
      Accounts: { Paused: 1, Live: 0, Total: 1 },
      Users: { Paused: 0, Live: 0, Total: 0 },
    },
    Trigger: {
      'New Code Trigger': { Paused: 0, Live: 0, Total: 0 },
      'New Project': { Paused: 0, Live: 0, Total: 0 },
    },
    Action: {
      'Create a New Project': { Paused: 0, Live: 0, Total: 0 },
    },
    Search: {},
    App: { Totals: { Paused: 1, Live: 0, Total: 1 } },
  },
  title: 'My WIstia app',
  public_ish: false,
  homepage_url: null,
  intention: 'private',
  role: 'user',
  public: false,
  pending: false,
  app_category: 'accounting',
  description: 'adsfasdfsadfasdfasdfasdf',
  key: 'App17741',
  latest_core_npm_version: '8.1.0',
  date: '2019-04-30T18:09:26+00:00',
  slug: null,
  versions: ['1.0.0', '1.0.1'],
  app_category_other: null,
  all_versions: ['1.0.0', '1.0.1'],
  latest_version: '1.0.1',
  core_versions: ['8.0.1', '8.0.1'],
  service_id: null,
  is_beta: null,
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

describe('convert', () => {
  let tempAppDir, readTempFile;

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
    readTempFile = (fpath) =>
      fs.readFileSync(path.join(tempAppDir, fpath), 'utf-8');
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  describe('visual builder apps', () => {
    it('should create separate files', async () => {
      await convertApp(visualApp, visualAppDefinition, tempAppDir);
      [
        '.zapierapprc',
        '.gitignore',
        '.env',
        'package.json',
        'index.js',
        'triggers/codemode.js',
        'triggers/project.js',
        'creates/create_project.js',
        'test/triggers/codemode.js',
        'test/triggers/project.js',
        'test/creates/create_project.js',
        'authentication.js',
      ].forEach((filename) => {
        const filepath = path.join(tempAppDir, filename);
        fs.existsSync(filepath).should.be.true(`failed to create ${filename}`);
      });

      // needed for the test below which expects to be able to import core
      await fs.outputFile(
        path.join(
          tempAppDir,
          'node_modules',
          'zapier-platform-core',
          'index.js'
        ),
        `module.exports = {version: "${visualAppDefinition.platformVersion}"}`
      );

      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql('my-w-istia-app');
      should(pkg.dependencies['zapier-platform-core']).eql(
        visualAppDefinition.platformVersion
      );
      should(pkg.version).eql('1.0.2');

      const rcFile = JSON.parse(readTempFile('.zapierapprc'));
      should(rcFile.id).eql(visualApp.id);
      should(rcFile.includeInBuild).be.undefined();

      const envFile = readTempFile('.env');
      should(envFile.includes('ACCESS_TOKEN')).be.true();
      should(envFile.includes('REFRESH_TOKEN')).be.true();

      const idxFile = readTempFile('index.js');

      should(idxFile.includes("require('./package.json').version")).be.true();
      should(
        idxFile.includes("require('zapier-platform-core').version")
      ).be.true();

      // requiring the file ensures the js is syntactically valid
      const idx = require(path.join(tempAppDir, 'index.js'));
      should(idx.version).eql('1.0.2'); // bumped from 1.0.1
      should(idx.platformVersion).eql(visualAppDefinition.platformVersion);

      // dynamic fields
      const createFile = readTempFile('creates/create_project.js');
      should(createFile.includes('source:')).be.false();
      should(createFile.includes('getInputFields = ')).be.true();
      should(createFile.includes('getInputFields0')).be.false();
      should(createFile.includes('getInputFields1 = ')).be.true();
    });

    it('should not break over a comment', async () => {
      // https://github.com/zapier/zapier-platform/issues/142
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.triggers.codemode.operation.perform.source +=
        '\n// a comment';
      await convertApp(visualApp, appDefinition, tempAppDir);
    });
  });
});
