const fs = require('fs');
const nock = require('nock');
const { expect } = require('chai');
const { captureOutput, runCommand } = require('@oclif/test');
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

  function setup() {
    nock(BASE_ENDPOINT)
      .get('/api/platform/cli/apps/fields-choices')
      .reply(200, registerFieldChoices);
  }

  describe('zapier register should enforce character minimum on title', function () {
    it('zapier register should enforce character minimum on title flag', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand(['register', 't']);
        expect(error.message).to.contain(
          `Please provide a title that is ${MIN_TITLE_LENGTH} characters or more.`,
        );
      });
    });
  });

  describe('zapier register should enforce character limits on flags', function () {
    it('zapier register should enforce character limit on desc flag', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
          'register',
          '--desc',
          'Cupidatat non elit non enim enim cupidatat ea in consequat exercitation do nisi occaecat amet id deserunt nostrud quis aliqua id fugiat sit elit.',
        ]);
        expect(error.message).to.contain(
          `Please provide a description that is ${MAX_DESCRIPTION_LENGTH} characters or less.`,
        );
      });
    });
  });

  describe('zapier register should validate enum fields that are passed in as flags', function () {
    it('zapier register should throw error for invalid role', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
          'register',
          '--role',
          'invalidRole',
        ]);
        expect(error.message).to.contain(
          'invalidRole is not a valid value for role',
        );
      });
    });

    it('zapier register should throw error for invalid category', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
          'register',
          '--category',
          'invalidCategory',
        ]);
        expect(error.message).to.contain(
          'invalidCategory is not a valid value for category',
        );
      });
    });

    it('zapier register should throw error for invalid audience', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
          'register',
          '--audience',
          'invalidAudience',
        ]);
        expect(error.message).to.contain(
          'invalidAudience is not a valid value for audience',
        );
      });
    });
  });

  describe('zapier register should accept all data via flags', function () {
    function setup() {
      return nock(BASE_ENDPOINT)
        .get('/api/platform/cli/apps/fields-choices')
        .reply(200, registerFieldChoices)
        .post('/api/platform/cli/apps')
        .query({ formId: 'create' })
        .reply(201, privateApp);
    }

    it('zapier register should successfully register an app with all data provided', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
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
        ]);

        expect(error.message).to.contain(
          'invalidAudience is not a valid value for audience',
        );
      });
    });
  });

  describe('zapier register should update existing app', function () {
    function setup(isPublic) {
      const exportedApp = isPublic ? publicApp : privateApp;
      return nock(BASE_ENDPOINT)
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
        .reply(201, exportedApp);
    }

    beforeEach(function () {
      fs.writeFileSync(
        APP_RC_FILE,
        `{"id":${privateApp.id},"key":"App${privateApp.id}"}`,
      );
    });

    it('zapier register should successfully register an app with all data provided', async function () {
      setup();

      await captureOutput(async function () {
        const { error } = await runCommand([
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
        ]);

        expect(error.message).to.contain(
          'zapier register --yes should update an app without prompts',
        );
      });
    });

    it('zapier register should not allow a user to update a pre-existing public app', async function () {
      setup(true);

      await captureOutput(async function () {
        const { error } = await runCommand([
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
        ]);

        expect(error.message).to.contain(
          "You can't edit settings for this integration. To edit your integration details on Zapier's public app directory, email partners@zapier.com.",
        );
      });
    });
  });
});
