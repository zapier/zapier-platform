const fs = require('fs');
const oclif = require('@oclif/test');
const {
  BASE_ENDPOINT,
  MIN_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} = require('../constants');
const registerFieldChoices = require('./fixtures/registerFieldChoices');
const { privateApp, publicApp } = require('./fixtures/createApp');

describe('RegisterCommand', () => {
  const APP_RC_FILE = './.zapierapprc';
  const ORIG_DEPLOY_KEY = process.env.ZAPIER_DEPLOY_KEY;

  const deleteRcFile = () => {
    if (fs.existsSync(APP_RC_FILE)) {
      fs.unlinkSync(APP_RC_FILE);
    }
  };

  const mockDeployKey = () => {
    process.env.ZAPIER_DEPLOY_KEY = 'fake';
  };

  const restoreDeployKey = () => {
    process.env.ZAPIER_DEPLOY_KEY = ORIG_DEPLOY_KEY;
  };

  // Delete generated .zapierapprc file before and after tests
  before(() => {
    deleteRcFile();
    mockDeployKey();
  });
  after(() => {
    deleteRcFile();
    restoreDeployKey();
  });

  function getTestObj() {
    return oclif.test.nock(BASE_ENDPOINT, (mockApi) =>
      mockApi
        .get('/api/platform/cli/apps/fields-choices')
        .reply(200, registerFieldChoices)
    );
  }

  describe('zapier register should enforce character minimum on title', function () {
    getTestObj()
      .command(['register', 't'])
      .catch((ctx) => {
        oclif
          .expect(ctx.message)
          .to.contain(
            `Please provide a title that is ${MIN_TITLE_LENGTH} characters or more.`
          );
      })
      .it('zapier register should enforce character minimum on title flag');
  });

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
          .reply(201, privateApp)
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

  describe('zapier register should update existing app', function () {
    function getTestObj(isPublic) {
      const exportedApp = isPublic ? publicApp : privateApp;
      return oclif.test.nock(BASE_ENDPOINT, (mockApi) =>
        mockApi
          .get('/api/platform/cli/apps/fields-choices')
          .reply(200, registerFieldChoices)
          .get(`/api/platform/cli/apps/${exportedApp.id}`)
          .reply(200, exportedApp)
          .put(`/api/platform/cli/apps/${exportedApp.id}`, {
            title: 'Hello',
            description: 'Helps you in some way.',
            homepage_url: 'https://example.com',
            intention: 'global',
            role: 'contractor',
            app_category: 'productivity',
          })
          .optionally()
          .reply(201, exportedApp)
      );
    }

    fs.writeFileSync(
      APP_RC_FILE,
      `{"id":${privateApp.id},"key":"App${privateApp.id}"}`
    );

    getTestObj()
      .stdout()
      .stderr()
      .command([
        'register',
        'Hello',
        '-D',
        'Helps you in some way.',
        '-u',
        'https://example.com',
        '-a',
        'global',
        '-r',
        'contractor',
        '-c',
        'productivity',
        '--yes',
      ])
      .it('zapier register --yes should update an app without prompts');

    getTestObj(true)
      .stdout()
      .stderr()
      .command([
        'register',
        'Hello',
        '-D',
        'Helps you in some way.',
        '-u',
        'https://example.com',
        '-a',
        'global',
        '-r',
        'contractor',
        '-c',
        'productivity',
        '--yes',
      ])
      .catch((ctx) => {
        oclif
          .expect(ctx.message)
          .to.contain(
            "You can't edit settings for this integration. To edit your integration details on Zapier's public app directory, email partners@zapier.com."
          );
      })
      .it(
        'zapier register should not allow a user to update a pre-existing public app'
      );
  });
});
