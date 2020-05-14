const should = require('should');
const api = require('../../utils/api');
const { AUTH_KEY, CURRENT_APP_FILE } = require('../../constants');
const mock = require('mock-fs');
const nock = require('nock');

describe('api', () => {
  const answer = 'verysecretkey';
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
      mock({
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
      mock();
      return api
        .writeLinkedAppConfig({ id: 1, key: 'App1' })
        .then(api.getLinkedAppConfig)
        .then((config) => {
          config.id.should.equal(1);
          should.not.exist(config.extra);
        });
    });

    afterEach(mock.restore);
  });

  describe('listEndpoint', () => {
    before(() => {
      if (!nock.isActive()) {
        nock.activate();
      }
    });

    beforeEach(() => {
      process.env.ZAPIER_DEPLOY_KEY = answer;
      mock({
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
      mock.restore();
      delete process.env.ZAPIER_DEPLOY_KEY;
    });

    after(() => {
      nock.restore();
    });
  });
});
