const oclif = require('@oclif/test');
const { BASE_ENDPOINT, MAX_DESCRIPTION_LENGTH } = require('../constants');
const registerFieldChoices = require('./fixtures/registerFieldChoices');

describe('RegisterCommand', () => {
  describe('zapier register should enforce character limits on flags', function () {
    oclif.test
      .command([
        'register',
        '--desc',
        'Cupidatat non elit non enim enim cupidatat ea in consequat exercitation do nisi occaecat amet id deserunt nostrud quis aliqua id fugiat sit elit.',
      ])
      .catch((ctx) => {
        oclif
          .expect(ctx.message)
          .to.contain(
            `Please provide a description that is ${MAX_DESCRIPTION_LENGTH} characters or less.`
          );
      })
      .it('zapier register should enforce character limit on desc flag');
  });

  describe('zapier register should validate enum fields that are passed in as flags', function () {
    function getTestObj() {
      return oclif.test.nock(BASE_ENDPOINT, (mockApi) =>
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
});
