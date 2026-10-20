const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const api = require('../../utils/api');
const { AUTH_KEY, CURRENT_APP_FILE } = require('../../constants');
const nock = require('nock');

describe('api', () => {
  const answer = 'verysecretkey';

  // The app config file is read from and written to process.cwd(), so run
  // those tests from a fresh temp dir.
  let origCwd;
  let tmpDir;
  const useTmpCwd = (files = {}) => {
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zapier-api-test-'));
    process.chdir(tmpDir);
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmpDir, name), content);
    }
  };
  const restoreCwd = () => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  };

  describe('credentials', () => {
    beforeEach(() => {
      process.env.ZAPIER_DEPLOY_KEY = answer;
    });

    it('should read credentials from env', async () => {
      const creds = await api.readCredentials();

      should.exist(creds[AUTH_KEY]);
    });

    afterEach(() => {
      delete process.env.ZAPIER_DEPLOY_KEY;
    });
  });

  describe('linkedAppConfigs', () => {
    beforeEach(() => {
      useTmpCwd({
        [CURRENT_APP_FILE]: '{ "id": 2864, "key": "App2864", "extra": 5 }',
      });
    });

    it('should read a config', () => {
      return api.getLinkedAppConfig().then((config) => {
        config.id.should.equal(2864);
      });
    });

    it('should write a config', () => {
      return api
        .writeLinkedAppConfig({ id: 1, key: 'App1' })
        .then(api.getLinkedAppConfig)
        .then((config) => {
          config.id.should.equal(1);
          config.extra.should.equal(5);
        });
    });

    it('should write even if it fails to read', () => {
      fs.rmSync(CURRENT_APP_FILE);
      return api
        .writeLinkedAppConfig({ id: 1, key: 'App1' })
        .then(api.getLinkedAppConfig)
        .then((config) => {
          config.id.should.equal(1);
          should.not.exist(config.extra);
        });
    });

    afterEach(restoreCwd);
  });

  describe('listEndpoint', () => {
    before(() => {
      if (!nock.isActive()) {
        nock.activate();
      }
    });

    beforeEach(() => {
      process.env.ZAPIER_DEPLOY_KEY = answer;
      useTmpCwd({
        [CURRENT_APP_FILE]: '{ "id": 2864, "key": "App2864", "extra": 5 }',
      });
    });

    it('should read from and endpoint', async () => {
      const reqheaders = {
        'X-Deploy-Key': answer,
      };

      nock('https://zapier.com', { reqheaders })
        .get('/api/platform/cli/check')
        .reply(200, {})
        .get('/api/platform/cli/apps/2864')
        .reply(200, {
          latest_core_version: '8.0.1',
          id: 2864,
          slug: 'steam',
          versions: ['2.0.2'],
          all_versions: ['1.0.0', '2.0.0', '2.0.1', '2.0.2'],
          latest_version: '2.0.2',
          core_versions: ['8.0.1'],
        })
        .get('/api/platform/cli/apps/2864/versions')
        .reply(200, {
          objects: [
            { id: 116873 },
            { id: 110884 },
            { id: 11028649 },
            { id: 40878 },
          ],
        });

      const res = await api.listEndpoint('versions');

      should.exist(res.app);
      should.exist(res.versions);
      should(res.versions.length).eql(4);
    });

    afterEach(() => {
      restoreCwd();
      delete process.env.ZAPIER_DEPLOY_KEY;
    });

    after(() => {
      nock.restore();
    });
  });

  describe('isPublished', () => {
    it('should return false for a private app', () => {
      should(api.isPublished('private')).false();
    });

    it('should return true for a public app', () => {
      should(api.isPublished('public')).true();
    });

    it('should return true for a beta app', () => {
      should(api.isPublished('beta')).true();
    });
  });
});
