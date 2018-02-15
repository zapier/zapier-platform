const should = require('should');
const api = require('../../utils/api');
const { AUTH_KEY } = require('../../constants');

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
});
