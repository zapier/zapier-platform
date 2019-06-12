const should = require('should');
const api = require('../../utils/api');
const { AUTH_KEY, CURRENT_APP_FILE } = require('../../constants');
const mock = require('mock-fs');

describe('api', () => {
  const answer = 'verysecretkey';

  it('should read credentials from env', done => {
    process.env.ZAPIER_DEPLOY_KEY = answer;
    api
      .readCredentials()
      .then(creds => {
        should.exist(creds[AUTH_KEY]);
        done();
      })
      .catch(done);
  });

  describe('linkedAppConfigs', () => {
    beforeEach(() => {
      mock({
        [CURRENT_APP_FILE]: '{ "id": 2864, "key": "App2864", "extra": 5 }'
      });
    });

    it('should read a config', () => {
      return api.getLinkedAppConfig().then(config => {
        config.id.should.equal(2864);
      });
    });

    it('should write a config', () => {
      return api
        .writeLinkedAppConfig({ id: 1, key: 'App1' })
        .then(api.getLinkedAppConfig)
        .then(config => {
          config.id.should.equal(1);
          config.extra.should.equal(5);
        });
    });

    it('should write even if it fails to read', () => {
      mock();
      return api
        .writeLinkedAppConfig({ id: 1, key: 'App1' })
        .then(api.getLinkedAppConfig)
        .then(config => {
          config.id.should.equal(1);
          should.not.exist(config.extra);
        });
    });

    afterEach(mock.restore);
  });
});
