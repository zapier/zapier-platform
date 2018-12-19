const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

require('should');

const { convertApp } = require('../../utils/convert');

const appDefinition = {
  beforeRequest: [
    {
      args: ['request', 'z', 'bundle'],
      source: 'return request;'
    }
  ],
  afterResponse: [
    {
      args: ['response', 'z', 'bundle'],
      source: 'return response;'
    }
  ],
  authentication: {
    type: 'custom',
    test: {
      source: "return 'test';"
    },
    fields: [{ key: 'api_key', required: true, type: 'string' }]
  },
  triggers: {
    movie: {
      key: 'movie',
      noun: 'Movie',
      display: {},
      operation: {
        perform: {
          source: "return 'test';"
        }
      }
    }
  }
};

const legacyApp = {
  general: {
    title: 'My Name Is',
    description: 'Just an example app.',
    app_id: 888
  }
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
  let tempAppDir;

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  it('should create separate files', async () => {
    await convertApp(legacyApp, appDefinition, tempAppDir, true);
    [
      '.zapierapprc',
      '.gitignore',
      '.env',
      'package.json',
      'index.js',
      'triggers/movie.js',
      'test/triggers/movie.js'
    ].forEach(filename => {
      const filepath = path.join(tempAppDir, filename);
      fs.existsSync(filepath).should.be.true();
    });
  });
});
