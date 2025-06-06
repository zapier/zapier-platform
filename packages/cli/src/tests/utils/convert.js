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
              "// Configure a request to an endpoint of your api that\n// returns custom field meta data for the authenticated\n// user.  Don't forget to congigure authentication!\n\nconst options = {\n  url: 'https://api.example.com/custom_field_meta_data',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // modify your api response to return an array of Field objects\n    // see https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#fieldschema\n    // for schema definition.\n\n    return results;\n  });\n",
          },
          {
            source:
              "// Configure a request to an endpoint of your api that\n// returns custom field meta data for the authenticated\n// user.  Don't forget to congigure authentication!\n\nconst options = {\n  url: 'https://api.example.com/custom_field_meta_data',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // modify your api response to return an array of Field objects\n    // see https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#fieldschema\n    // for schema definition.\n\n    return results;\n  });\n",
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
        description: 'asdfasda asdf asd fasd f',
        label: 'Create a New Project',
      },
      key: 'create_project',
    },
  },
  beforeRequest: [
    {
      source:
        // eslint-disable-next-line no-template-curly-in-string
        'const addApiKeyToHeader = (request, z, bundle) => {\n  request.headers["X-Subdomain"] = bundle.authData.subdomain;\n  const basicHash = Buffer.from(`${bundle.authData.api_key}:x`).toString(\n    "base64"\n  );\n  request.headers.Authorization = `Basic ${basicHash}`;\n  return request;\n};\n',
    },
  ],
  authentication: {
    test: {
      source:
        "const options = {\n  url: 'https://api.wistia.com/v1/account.json',\n  method: 'GET',\n  headers: {\n    Authorization: 'Bearer {{bundle.authData.access_token}}',\n  },\n  body: {}\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // You can do any parsing you need for results here before returning them\n\n    return results;\n  });",
    },
    fields: [
      {
        key: 'access_token',
        type: 'string',
        required: true,
      },
      {
        key: 'refresh_token',
        type: 'string',
        required: true,
      },
      {
        key: 'custom_auth_field',
        type: 'string',
        required: false,
      },
    ],
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
        source:
          "const options = {\n  url: 'https://api.wistia.com/oauth/token',\n  method: 'POST',\n  headers: {\n    'content-type': 'application/x-www-form-urlencoded',\n    accept: 'application/json',\n  },\n  body: {\n    grant_type: 'refresh_token',\n    refresh_token: '{{bundle.authData.refresh_token}}',\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // You can do any parsing you need for results here before returning them\n\n    return results;\n  });",
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
        description: 'Triggers on a new project created',
        label: 'New Project',
      },
      key: 'project',
    },
    codemode: {
      operation: {
        perform: {
          args: ['z'],
          source:
            "const options = {\n  url: 'https://jsonplaceholder.typicode.com/posts',\n  method: 'GET',\n  headers: {\n    'Accept': 'application/json'\n  },\n  params: {\n    '_limit': '3'\n  }\n}\n\nreturn z.request(options)\n  .then((response) => {\n    const results = response.data;\n\n    // You can do any parsing you need for results here before returning them\n\n    return results;\n  });",
        },
      },
      noun: 'Code',
      display: {
        hidden: false,
        description: "just runs some code, let's go",
        label: 'New Code Trigger',
      },
      key: 'codemode',
    },
  },
  hydrators: {
    getMovieDetails: {
      source:
        "const response = await z.request('https://example.com/movies.json');\n\nreturn response.data.map((movie) => {\n  // so maybe /movies.json is thin content but /movies/:id.json has more\n  // details we want...\n  movie.details = z.dehydrate(getMovieDetails, { id: movie.id });\n  return movie;\n});\n",
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
  let tempAppDir, readTempFile, origConsoleWarn;
  const warnings = [];

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
    readTempFile = (fpath) =>
      fs.readFileSync(path.join(tempAppDir, fpath), 'utf-8');

    origConsoleWarn = console.warn;
    warnings.length = 0;
    console.warn = (msg) => {
      warnings.push(msg);
    };
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);

    console.warn = origConsoleWarn;
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
        'test/triggers/codemode.test.js',
        'test/triggers/project.test.js',
        'test/creates/create_project.test.js',
        'authentication.js',
        'hydrators.js',
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
          'index.js',
        ),
        `module.exports = {version: "${visualAppDefinition.platformVersion}"}`,
      );

      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql('my-w-istia-app');
      should(pkg.dependencies['zapier-platform-core']).eql(
        visualAppDefinition.platformVersion,
      );
      should(pkg.version).eql('1.0.2');

      const rcFile = JSON.parse(readTempFile('.zapierapprc'));
      should(rcFile.id).eql(visualApp.id);
      should(rcFile.key).eql(visualApp.key);
      should(rcFile.includeInBuild).be.undefined();

      const countOccurrences = (str, search) => {
        const regex = new RegExp(search, 'g');
        return (str.match(regex) || []).length;
      };

      const envFile = readTempFile('.env');
      // prevent regression of duplicates when authentication.fields contains default fields
      should(countOccurrences(envFile, 'ACCESS_TOKEN=')).be.equals(1);
      should(countOccurrences(envFile, 'REFRESH_TOKEN=')).be.equals(1);
      should(envFile.includes('CUSTOM_AUTH_FIELD')).be.true();

      const idxFile = readTempFile('index.js');

      should(idxFile.includes("require('./package.json').version")).be.true();
      should(
        idxFile.includes("require('zapier-platform-core').version"),
      ).be.true();
      should(idxFile.includes('source:')).be.false();
      should(
        idxFile.includes('const beforeRequest = async(z, bundle)'),
      ).be.false();

      // requiring the file ensures the js is syntactically valid
      const idx = require(path.join(tempAppDir, 'index.js'));
      should(idx.version).eql('1.0.2'); // bumped from 1.0.1
      should(idx.platformVersion).eql(visualAppDefinition.platformVersion);

      // renderStep -> inputFields
      const createFile = readTempFile('creates/create_project.js');
      should(createFile.includes('source:')).be.false();
      should(
        createFile.includes('const inputFields = async (z, bundle)'),
      ).be.true();
      should(createFile.includes('inputFields0')).be.false();
      should(
        createFile.includes('const inputFields1 = async (z, bundle)'),
      ).be.true();

      // renderStep -> perform etc
      const triggerFile = readTempFile('triggers/codemode.js');
      should(triggerFile.includes('source:')).be.false();
      should(triggerFile.includes('args:')).be.false();
      should(triggerFile.includes('const perform = async (z)')).be.true();

      // renderAuth -> test, refreshAccessToken etc
      const authenticationFile = readTempFile('authentication.js');
      should(authenticationFile.includes('source:')).be.false();
      should(
        authenticationFile.includes('const test = async (z, bundle)'),
      ).be.true();
      should(
        authenticationFile.includes(
          'const refreshAccessToken = async (z, bundle)',
        ),
      ).be.true();

      // renderHydrators
      const hydratorsFile = readTempFile('hydrators.js');
      should(hydratorsFile.includes('source:')).be.false();
      should(
        hydratorsFile.includes('getMovieDetails = async (z, bundle)'),
      ).be.true();
    });

    it('should not break over a comment', async () => {
      // https://github.com/zapier/zapier-platform/issues/142
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.triggers.codemode.operation.perform.source +=
        '\n// a comment';
      await convertApp(visualApp, appDefinition, tempAppDir);
    });

    it('should not break over syntax error in authentication', async () => {
      // PDE-4495
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.authentication.test.source += '{ bad code }';
      await convertApp(visualApp, appDefinition, tempAppDir);

      warnings.should.have.length(1);
      warnings[0].should.containEql('Your code has syntax error');
      warnings[0].should.containEql('authentication.js');

      const authenticationFile = readTempFile('authentication.js');
      should(
        authenticationFile.includes('const test = async (z, bundle)'),
      ).be.true();
      should(authenticationFile.includes('{ bad code }')).be.true();
    });

    it('should not break over syntax error in step', async () => {
      // PDE-4495
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.triggers.codemode.operation.perform.source +=
        '{ bad code }';
      await convertApp(visualApp, appDefinition, tempAppDir);

      warnings.should.have.length(1);
      warnings[0].should.containEql('Your code has syntax error');
      warnings[0].should.containEql('triggers/codemode.js');

      const triggerFile = readTempFile('triggers/codemode.js');
      should(triggerFile.includes('const perform = async (z)')).be.true();
      should(triggerFile.includes('{ bad code }')).be.true();
    });

    it('should not break over syntax error in hydrator', async () => {
      // PDE-4495
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.hydrators.getMovieDetails.source += '{ bad code }';
      await convertApp(visualApp, appDefinition, tempAppDir);

      warnings.should.have.length(1);
      warnings[0].should.containEql('Your code has syntax error');
      warnings[0].should.containEql('hydrators.js');

      const hydratorsFile = readTempFile('hydrators.js');
      should(
        hydratorsFile.includes('getMovieDetails = async (z, bundle)'),
      ).be.true();
      should(hydratorsFile.includes('{ bad code }')).be.true();
    });

    it("should not replace 'source' in sample", async () => {
      // PDE-4495
      const appDefinition = cloneDeep(visualAppDefinition);
      appDefinition.creates.create_project.operation.sample = {
        id: 1234,
        data: {
          objects: [{ source: 'not a function' }],
        },
      };
      await convertApp(visualApp, appDefinition, tempAppDir);

      const createFile = readTempFile('creates/create_project.js');
      should(
        createFile.includes('const inputFields = async (z, bundle)'),
      ).be.true();
      should(createFile.includes("[{ source: 'not a function' }]")).be.true();
    });
  });

  describe('JSON definition conversion', () => {
    it('should convert from JSON definition with custom title and description', async () => {
      const appInfo = {
        title: 'My Custom App',
        description: 'A custom app for testing',
      };

      // Use a definition without a version to test the default behavior
      const customDefinition = {
        platformVersion: '8.0.1',
        triggers: {
          simple_trigger: {
            operation: {
              perform: {
                url: 'https://api.example.com/items',
                method: 'GET',
              },
            },
            noun: 'Item',
            display: {
              label: 'New Item',
              description: 'Triggers when a new item is created',
            },
            key: 'simple_trigger',
          },
        },
      };

      await convertApp(appInfo, customDefinition, tempAppDir);

      // Check package.json uses custom title and description
      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql('my-custom-app');
      should(pkg.description).eql('A custom app for testing');
      should(pkg.version).eql('1.0.0'); // no version bump since this is new

      // Should not create .zapierapprc when no app ID provided
      const rcExists = fs.existsSync(path.join(tempAppDir, '.zapierapprc'));
      should(rcExists).be.false();

      // All other files should still be created
      [
        '.gitignore',
        '.env',
        'package.json',
        'index.js',
        'triggers/simple_trigger.js',
        'test/triggers/simple_trigger.test.js',
      ].forEach((filename) => {
        const filepath = path.join(tempAppDir, filename);
        fs.existsSync(filepath).should.be.true(`failed to create ${filename}`);
      });
    });

    it('should handle empty title gracefully', async () => {
      const appInfo = {
        title: '',
        description: 'App with no title',
      };

      await convertApp(appInfo, visualAppDefinition, tempAppDir);

      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql(''); // kebab-case of empty string is empty string
      should(pkg.description).eql('App with no title');
    });

    it('should handle undefined title gracefully', async () => {
      const appInfo = {
        description: 'App with undefined title',
      };

      await convertApp(appInfo, visualAppDefinition, tempAppDir);

      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql('');
      should(pkg.description).eql('App with undefined title');
    });

    it('should handle minimal app info', async () => {
      const appInfo = {};
      const minimalDefinition = {
        platformVersion: '8.0.1',
        triggers: {
          simple_trigger: {
            operation: {
              perform: {
                url: 'https://api.example.com/items',
                method: 'GET',
              },
            },
            noun: 'Item',
            display: {
              label: 'New Item',
              description: 'Triggers when a new item is created',
            },
            key: 'simple_trigger',
          },
        },
      };

      await convertApp(appInfo, minimalDefinition, tempAppDir);

      const pkg = require(path.join(tempAppDir, 'package.json'));
      should(pkg.name).eql('');
      should(pkg.version).eql('1.0.0');

      // Should not create .zapierapprc
      const rcExists = fs.existsSync(path.join(tempAppDir, '.zapierapprc'));
      should(rcExists).be.false();

      // Should create basic files
      const triggerExists = fs.existsSync(
        path.join(tempAppDir, 'triggers/simple_trigger.js'),
      );
      should(triggerExists).be.true();
    });
  });

  describe('.zapierapprc creation', () => {
    it('should not create .zapierapprc when appInfo has no id', async () => {
      const appInfo = {
        title: 'Test App',
        key: 'some-key', // key without id should not create file
      };

      await convertApp(appInfo, visualAppDefinition, tempAppDir);

      const rcExists = fs.existsSync(path.join(tempAppDir, '.zapierapprc'));
      should(rcExists).be.false();
    });

    it('should create .zapierapprc with only id when no key provided', async () => {
      const appInfo = {
        id: 12345,
        title: 'Test App',
      };

      await convertApp(appInfo, visualAppDefinition, tempAppDir);

      const rcFile = JSON.parse(readTempFile('.zapierapprc'));
      should(rcFile.id).eql(12345);
      should(rcFile.key).be.undefined();
    });

    it('should create .zapierapprc with both id and key', async () => {
      const appInfo = {
        id: 12345,
        key: 'TestApp12345',
        title: 'Test App',
      };

      await convertApp(appInfo, visualAppDefinition, tempAppDir);

      const rcFile = JSON.parse(readTempFile('.zapierapprc'));
      should(rcFile.id).eql(12345);
      should(rcFile.key).eql('TestApp12345');
    });
  });
});
