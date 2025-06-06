const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const should = require('should');
const { captureOutput } = require('@oclif/test');

const ConvertCommand = require('../../oclif/commands/convert');

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

describe('ConvertCommand', () => {
  let tempAppDir;

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  describe('command validation', () => {
    it('should require either integrationId or json', async () => {
      const { error } = await captureOutput(async () => {
        await ConvertCommand.run([tempAppDir]);
      });

      should(error).be.ok();
      should(error.message).containEql(
        'You must provide either an integrationId or json.',
      );
    });

    it('should accept integrationId with version', async () => {
      const { error } = await captureOutput(async () => {
        await ConvertCommand.run([
          tempAppDir,
          '--integrationId',
          '123',
          '--version',
          '1.0.0',
        ]);
      });

      // Should not error about missing integrationId/json
      // (may error for other reasons like API calls, but that's expected)
      if (error) {
        should(error.message).not.containEql(
          'You must provide either an integrationId or json.',
        );
      }
    });

    it('should accept json without integrationId', async () => {
      const { error } = await captureOutput(async () => {
        await ConvertCommand.run([
          tempAppDir,
          '--json',
          '{"platformVersion": "8.0.1"}',
        ]);
      });

      // Should not error about missing integrationId/json
      // (may error for other reasons, but that's expected)
      if (error) {
        should(error.message).not.containEql(
          'You must provide either an integrationId or json.',
        );
      }
    });

    it('should not allow both integrationId and json', async () => {
      const { error } = await captureOutput(async () => {
        await ConvertCommand.run([
          tempAppDir,
          '--integrationId',
          '123',
          '--version',
          '1.0.0',
          '--json',
          '{"platformVersion": "8.0.1"}',
        ]);
      });

      should(error).be.ok();
      // This should fail due to flag exclusivity, not our new validation
      should(error.message).not.containEql(
        'You must provide either an integrationId or json.',
      );
    });

    it('should require version when integrationId is provided', async () => {
      const { error } = await captureOutput(async () => {
        await ConvertCommand.run([tempAppDir, '--integrationId', '123']);
      });

      should(error).be.ok();
      // Should fail due to flag dependency, not our new validation
      should(error.message).not.containEql(
        'You must provide either an integrationId or json.',
      );
    });
  });

  describe('generateCreateFunc', () => {
    let command;

    beforeEach(() => {
      command = new ConvertCommand();
    });

    it('should handle json from direct JSON string', async () => {
      const json = '{"platformVersion": "8.0.1", "triggers": {}}';
      const title = 'Test App';
      const description = 'Test Description';

      const createFunc = command.generateCreateFunc(
        null,
        null,
        json,
        title,
        description,
      );

      should(createFunc).be.a.Function();

      // Mock convertApp to test JSON parsing in isolation
      const originalConvertApp = require('../../utils/convert').convertApp;
      require('../../utils/convert').convertApp = (
        appInfo,
        appDefinition,
        _tempAppDir,
      ) => {
        // Verify the JSON was parsed correctly and parameters are correct
        should(appInfo.title).eql(title);
        should(appInfo.description).eql(description);
        should(appDefinition.platformVersion).eql('8.0.1');
        return Promise.resolve();
      };

      await createFunc(tempAppDir);

      // Restore original function
      require('../../utils/convert').convertApp = originalConvertApp;
    });

    it('should handle json from file', async () => {
      const jsonFile = path.join(tempAppDir, 'definition.json');
      const jsonContent = {
        platformVersion: '8.0.1',
        triggers: { test: 'trigger' },
      };
      await fs.writeJSON(jsonFile, jsonContent);

      const json = `@${jsonFile}`;
      const title = 'File App';
      const description = 'From file';

      const createFunc = command.generateCreateFunc(
        null,
        null,
        json,
        title,
        description,
      );

      should(createFunc).be.a.Function();

      // Mock convertApp to test file reading logic in isolation
      const originalConvertApp = require('../../utils/convert').convertApp;
      require('../../utils/convert').convertApp = (
        appInfo,
        appDefinition,
        _tempAppDir,
      ) => {
        // Verify the file was read and parsed correctly
        should(appInfo.title).eql(title);
        should(appInfo.description).eql(description);
        should(appDefinition).eql(jsonContent);
        return Promise.resolve();
      };

      await createFunc(tempAppDir);

      // Restore original function
      require('../../utils/convert').convertApp = originalConvertApp;
    });

    it('should handle invalid JSON gracefully', async () => {
      const json = '{"invalid": json}';
      const title = 'Invalid App';
      const description = 'Invalid JSON';

      const createFunc = command.generateCreateFunc(
        null,
        null,
        json,
        title,
        description,
      );

      let errorThrown = false;
      try {
        await createFunc(tempAppDir);
      } catch (e) {
        errorThrown = true;
        should(e.message).containEql('JSON');
      }

      should(errorThrown).be.true();
    });
  });
});
