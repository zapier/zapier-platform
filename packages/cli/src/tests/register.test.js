const oclif = require('@oclif/test');
const constants = require('../constants');
const registerFieldChoices = require('./fixtures/registerFieldChoices');

describe('zapier register should validate enum fields that are passed in as flags', function () {
  function getTestObj() {
    return oclif.test.nock(constants.BASE_ENDPOINT, (mockApi) =>
      mockApi
        .get('/api/platform/cli/apps/fields-choices')
        .reply(200, registerFieldChoices)
    );
  }

  getTestObj()
    .command(['register', '--role', 'invalidRole'])
    .catch((ctx) => {
      oclif
        .expect(ctx.message)
        .to.contain('invalidRole is not a valid value for role');
    })
    .it('zapier register should throw error for invalid role');

  getTestObj()
    .command(['register', '--category', 'invalidCategory'])
    .catch((ctx) => {
      oclif
        .expect(ctx.message)
        .to.contain('invalidCategory is not a valid value for category');
    })
    .it('zapier register should throw error for invalid category');

  getTestObj()
    .command(['register', '--audience', 'invalidAudience'])
    .catch((ctx) => {
      oclif
        .expect(ctx.message)
        .to.contain('invalidAudience is not a valid value for audience');
    })
    .it('zapier register should throw error for invalid audience');
});
