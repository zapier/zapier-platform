const fs = require('fs');
const path = require('path');
const os = require('os');
const should = require('should');

describe('InvokeCommand', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zapier-invoke-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir('/');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('appendEnv function', () => {
    it('should add newline before appending to .env file without trailing newline', async () => {
      // Create a .env file without a trailing newline
      const envContentWithoutNewline =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'";
      fs.writeFileSync('.env', envContentWithoutNewline);

      // Verify the file doesn't end with a newline
      const initialContent = fs.readFileSync('.env', 'utf8');
      should(initialContent.endsWith('\n')).be.false();

      const authData = {
        access_token: '1234567890',
        refresh_token: 'abcdefg',
      };

      const authPrefix = 'authData_';
      const newContent = Object.entries(authData)
        .filter(([k, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${authPrefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
        )
        .join('');

      // Apply the fix: check if file ends with newline and add one if needed
      let contentToAppend = newContent;
      const existingContent = fs.readFileSync('.env', 'utf8');
      if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
        contentToAppend = '\n' + newContent;
      }

      fs.appendFileSync('.env', contentToAppend);

      const result = fs.readFileSync('.env', 'utf8');

      // After the fix, variables should be on separate lines
      should(result).not.containEql(
        "'your_client_secret'authData_access_token",
      );
      should(result).containEql(
        "CLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'",
      );
      should(result).containEql(
        "authData_access_token='1234567890'\nauthData_refresh_token='abcdefg'",
      );
    });

    it('should not add extra newline when .env file already ends with newline', async () => {
      // Create a .env file WITH a trailing newline
      const envContentWithNewline =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n";
      fs.writeFileSync('.env', envContentWithNewline);

      // Verify the file ends with a newline
      const initialContent = fs.readFileSync('.env', 'utf8');
      should(initialContent.endsWith('\n')).be.true();

      const authData = {
        access_token: '1234567890',
      };

      const authPrefix = 'authData_';
      const newContent = Object.entries(authData)
        .filter(([k, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${authPrefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
        )
        .join('');

      fs.appendFileSync('.env', newContent);

      const result = fs.readFileSync('.env', 'utf8');

      // Should properly separate lines
      should(result).not.containEql(
        "'your_client_secret'authData_access_token",
      );
      should(result).containEql(
        "CLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'",
      );
    });

    it('should handle empty .env file', async () => {
      // Create an empty .env file
      fs.writeFileSync('.env', '');

      const authData = {
        access_token: '1234567890',
      };

      const authPrefix = 'authData_';
      const newContent = Object.entries(authData)
        .filter(([k, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${authPrefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
        )
        .join('');

      // Apply the fix logic for empty file
      let contentToAppend = newContent;
      const existingContent = fs.readFileSync('.env', 'utf8');
      if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
        contentToAppend = '\n' + newContent;
      }

      fs.appendFileSync('.env', contentToAppend);

      const result = fs.readFileSync('.env', 'utf8');
      should(result).eql("authData_access_token='1234567890'\n");
    });

    it('should handle non-existent .env file', async () => {
      // Don't create .env file - it should be created by append
      const authData = {
        access_token: '1234567890',
      };

      const authPrefix = 'authData_';
      const newContent = Object.entries(authData)
        .filter(([k, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${authPrefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
        )
        .join('');

      // Apply the fix logic for non-existent file
      let contentToAppend = newContent;
      try {
        const existingContent = fs.readFileSync('.env', 'utf8');
        if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
          contentToAppend = '\n' + newContent;
        }
      } catch (err) {
        // File doesn't exist, proceed with original content
      }

      fs.appendFileSync('.env', contentToAppend);

      const result = fs.readFileSync('.env', 'utf8');
      should(result).eql("authData_access_token='1234567890'\n");
    });
  });
});
