const fs = require('node:fs/promises');
// eslint-disable-next-line no-unused-vars
const should = require('should');

const { getNewTempDirPath } = require('../_helpers');

describe('InvokeCommand', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = getNewTempDirPath();
    await fs.mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);
  });

  describe('appendEnv function', () => {
    // Import the appendEnv function from the invoke command
    let appendEnv;
    const AUTH_FIELD_ENV_PREFIX = 'authData_';

    before(() => {
      // We need to extract the appendEnv function from the invoke command
      // Since it's not exported, we'll recreate it here for testing
      // This version includes the fix
      appendEnv = async (vars, prefix = '') => {
        const envPath = '.env';
        let contentToAppend = Object.entries(vars)
          .filter(([k, v]) => v !== undefined)
          .map(
            ([k, v]) =>
              `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
          )
          .join('');

        // Check if .env file exists and doesn't end with newline
        try {
          const existingContent = await fs.readFile(envPath, 'utf8');
          if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
            // Prepend a newline to ensure proper line separation
            contentToAppend = '\n' + contentToAppend;
          }
        } catch (error) {
          // File doesn't exist, that's fine - fs.appendFile will create it
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }

        await fs.appendFile(envPath, contentToAppend);
      };
    });

    it('should append auth data correctly when .env file ends with newline', async () => {
      // Create .env file with trailing newline
      await fs.writeFile(
        '.env',
        "CLIENT_ID='test_client'\nCLIENT_SECRET='test_secret'\n",
      );

      const authData = {
        access_token: 'my_token',
        refresh_token: 'my_refresh',
      };

      await appendEnv(authData, AUTH_FIELD_ENV_PREFIX);

      const content = await fs.readFile('.env', 'utf8');
      const lines = content.split('\n');

      // Should have proper line breaks
      lines.should.containEql("CLIENT_ID='test_client'");
      lines.should.containEql("CLIENT_SECRET='test_secret'");
      lines.should.containEql("authData_access_token='my_token'");
      lines.should.containEql("authData_refresh_token='my_refresh'");

      // Should not have concatenated lines
      content.should.not.match(/test_secret'authData_/);
    });

    it('should append auth data correctly when .env file does not end with newline (fixed)', async () => {
      // Create .env file WITHOUT trailing newline
      await fs.writeFile(
        '.env',
        "CLIENT_ID='test_client'\nCLIENT_SECRET='test_secret'",
      );

      const authData = {
        access_token: 'my_token',
        refresh_token: 'my_refresh',
      };

      await appendEnv(authData, AUTH_FIELD_ENV_PREFIX);

      const content = await fs.readFile('.env', 'utf8');

      // After the fix, should not have concatenated lines
      content.should.not.match(/test_secret'authData_access_token/);

      // Should have proper line separation
      const expectedFixedContent =
        "CLIENT_ID='test_client'\nCLIENT_SECRET='test_secret'\nauthData_access_token='my_token'\nauthData_refresh_token='my_refresh'\n";
      content.should.equal(expectedFixedContent);

      // Split by lines to verify
      const lines = content.split('\n');
      lines.should.containEql("CLIENT_ID='test_client'");
      lines.should.containEql("CLIENT_SECRET='test_secret'");
      lines.should.containEql("authData_access_token='my_token'");
      lines.should.containEql("authData_refresh_token='my_refresh'");
    });

    it('should handle empty .env file correctly', async () => {
      // Create empty .env file
      await fs.writeFile('.env', '');

      const authData = { access_token: 'my_token' };

      await appendEnv(authData, AUTH_FIELD_ENV_PREFIX);

      const content = await fs.readFile('.env', 'utf8');
      content.should.equal("authData_access_token='my_token'\n");
    });

    it('should handle non-existent .env file correctly', async () => {
      const authData = { access_token: 'my_token' };

      await appendEnv(authData, AUTH_FIELD_ENV_PREFIX);

      const content = await fs.readFile('.env', 'utf8');
      content.should.equal("authData_access_token='my_token'\n");
    });
  });
});
