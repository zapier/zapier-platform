require('should');
const fs = require('node:fs/promises');
const mockfs = require('mock-fs');

describe('appendEnv function', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = '/tmp/test-invoke';
    mockfs({
      [tempDir]: {},
    });
    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(() => {
    mockfs.restore();
  });

  describe('newline handling', () => {
    // This is the fixed version of appendEnv that we want to implement
    const appendEnv = async (vars, prefix = '') => {
      // Check if .env file exists and read its content
      let shouldPrependNewline = false;
      try {
        const content = await fs.readFile('.env', 'utf8');
        if (content.length > 0 && !content.endsWith('\n')) {
          shouldPrependNewline = true;
        }
      } catch (err) {
        // File doesn't exist, no need to prepend newline
        shouldPrependNewline = false;
      }

      const newContent = Object.entries(vars)
        .filter(([k, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
        )
        .join('');

      const contentToAppend = shouldPrependNewline
        ? '\n' + newContent
        : newContent;

      await fs.appendFile('.env', contentToAppend);
    };

    it('should append variables to new line when .env file does not end with newline', async () => {
      // Create .env file without trailing newline (this reproduces the bug)
      const existingContent =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'";
      await fs.writeFile('.env', existingContent);

      // Test the appendEnv function by simulating auth data
      const authData = {
        access_token: '1234567890',
        refresh_token: 'abcdefg',
      };

      // Test the fixed appendEnv function
      await appendEnv(authData, 'authData_');

      // Read the file and verify the result
      const result = await fs.readFile('.env', 'utf8');
      const expectedResult =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'\nauthData_refresh_token='abcdefg'\n";

      result.should.equal(expectedResult);

      // Verify that the variables are on separate lines
      const lines = result.split('\n');
      lines[0].should.equal("CLIENT_ID='your_client_id'");
      lines[1].should.equal("CLIENT_SECRET='your_client_secret'");
      lines[2].should.equal("authData_access_token='1234567890'");
      lines[3].should.equal("authData_refresh_token='abcdefg'");
    });

    it('should append variables normally when .env file ends with newline', async () => {
      // Create .env file with trailing newline
      const existingContent =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n";
      await fs.writeFile('.env', existingContent);

      // Test the appendEnv function by simulating auth data
      const authData = {
        access_token: '1234567890',
      };

      await appendEnv(authData, 'authData_');

      // Read the file and verify the result
      const result = await fs.readFile('.env', 'utf8');
      const expectedResult =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'\n";

      result.should.equal(expectedResult);
    });

    it('should handle empty .env file correctly', async () => {
      // Create empty .env file
      await fs.writeFile('.env', '');

      const authData = {
        access_token: '1234567890',
      };

      await appendEnv(authData, 'authData_');

      const result = await fs.readFile('.env', 'utf8');
      const expectedResult = "authData_access_token='1234567890'\n";

      result.should.equal(expectedResult);
    });

    it('should handle non-existent .env file correctly', async () => {
      const authData = {
        access_token: '1234567890',
      };

      await appendEnv(authData, 'authData_');

      const result = await fs.readFile('.env', 'utf8');
      const expectedResult = "authData_access_token='1234567890'\n";

      result.should.equal(expectedResult);
    });

    it('should demonstrate the original bug', async () => {
      // This test demonstrates what happens with the original appendEnv function
      const originalAppendEnv = async (vars, prefix = '') => {
        await fs.appendFile(
          '.env',
          Object.entries(vars)
            .filter(([k, v]) => v !== undefined)
            .map(
              ([k, v]) =>
                `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
            ),
        );
      };

      // Create .env file without trailing newline
      const existingContent =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'";
      await fs.writeFile('.env', existingContent);

      const authData = {
        access_token: '1234567890',
      };

      await originalAppendEnv(authData, 'authData_');

      const result = await fs.readFile('.env', 'utf8');

      // This demonstrates the bug: access_token is appended to the same line as CLIENT_SECRET
      const expectedBuggyResult =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'authData_access_token='1234567890'\n";

      result.should.equal(expectedBuggyResult);
    });
  });
});
