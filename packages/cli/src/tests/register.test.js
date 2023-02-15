const fs = require('fs');
const oclif = require('@oclif/test');
const { BASE_ENDPOINT, MAX_DESCRIPTION_LENGTH } = require('../constants');
const registerFieldChoices = require('./fixtures/registerFieldChoices');
const createApp = require('./fixtures/createApp');
const { after } = require('mocha');

describe('RegisterCommand', () => {
  // Delete generated .zapierapprc file after all tests run
  after(() => {
    const apprcFile = './.zapierapprc';
    if (fs.statSync(apprcFile, { throwIfNoEntry: false })) {
      fs.unlinkSync(apprcFile);
    }
  });

  function getTestObj() {
    return oclif.test.nock(BASE_ENDPOINT, (mockApi) =>
      mockApi
        .get('/api/platform/cli/apps/fields-choices')
        .reply(200, registerFieldChoices)
    );
  }

  describe('zapier register should enforce character limits on flags', function () {
    getTestObj()
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

  describe('zapier register should accept all data via flags', function () {
    function getTestObj() {
      return oclif.test.nock(BASE_ENDPOINT, (mockApi) =>
        mockApi
          .get('/api/platform/cli/apps/fields-choices')
          .reply(200, registerFieldChoices)
          .post('/api/platform/cli/apps')
          .query({ formId: 'create' })
          .reply(201, createApp)
      );
    }

    getTestObj()
      .stdout()
      .stderr()
      .command([
        'register',
        'My Cool Integration',
        '--desc',
        'My Cool Integration helps you integrate your apps with the apps that you need.',
        '--url',
        'https://www.zapier.com',
        '--audience',
        'private',
        '--role',
        'employee',
        '--category',
        'marketing-automation',
        '--subscribe',
      ])
      .it(
        'zapier register should successfully register an app with all data provided'
      );
  });
});
