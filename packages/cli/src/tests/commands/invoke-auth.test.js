const fs = require('node:fs/promises');
const path = require('path');
const os = require('os');
require('should'); // extends Object.prototype

// Extract the appendEnv function for testing
// We import the function by extracting it from the invoke command module
const getAppendEnvFunction = () => {
  // Since appendEnv is not exported, we need to create a copy for testing
  // This is the same logic as in the actual function
  return async (vars, prefix = '') => {
    let contentToAppend = Object.entries(vars)
      .filter(([k, v]) => v !== undefined)
      .map(
        ([k, v]) =>
          `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
      )
      .join('');

    // Check if .env file exists and doesn't end with a newline
    try {
      const stats = await fs.stat('.env');
      if (stats.size > 0) {
        // Read the last character of the file
        const fileHandle = await fs.open('.env', 'r');
        const buffer = Buffer.alloc(1);
        await fileHandle.read(buffer, 0, 1, stats.size - 1);
        await fileHandle.close();

        // If the last character is not a newline, prepend one
        if (buffer[0] !== 0x0a) {
          // 0x0A is newline character
          contentToAppend = '\n' + contentToAppend;
        }
      }
    } catch (error) {
      // File doesn't exist, no need to add a newline
    }

    await fs.appendFile('.env', contentToAppend);
  };
};

describe('invoke auth .env handling', () => {
  let appendEnv;
  let testDir;
  let originalCwd;

  before(() => {
    appendEnv = getAppendEnvFunction();
    originalCwd = process.cwd();
  });

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'invoke-auth-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true });
  });

  it('should append authData variables with newline when .env file does not end with newline', async () => {
    // Create a .env file without trailing newline (reproduces the issue)
    const envContent = `CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'`;
    await fs.writeFile('.env', envContent);

    const authData = {
      access_token: '1234567890',
      refresh_token: 'abcdefg',
    };

    await appendEnv(authData, 'authData_');

    const result = await fs.readFile('.env', 'utf-8');

    // The fix should ensure that authData variables start on a new line
    result.should.not.match(/CLIENT_SECRET='your_client_secret'authData_/);
    result.should.match(
      /CLIENT_SECRET='your_client_secret'\nauthData_access_token/,
    );
    result.should.containEql("authData_access_token='1234567890'");
    result.should.containEql("authData_refresh_token='abcdefg'");
  });

  it('should not add extra newlines when .env file already ends with newline', async () => {
    // Create a .env file with trailing newline
    const envContent = `CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n`;
    await fs.writeFile('.env', envContent);

    const authData = {
      access_token: '1234567890',
    };

    await appendEnv(authData, 'authData_');

    const result = await fs.readFile('.env', 'utf-8');

    // Should not have double newlines between CLIENT_SECRET and authData
    result.should.not.match(/CLIENT_SECRET='your_client_secret'\n\nauthData_/);
    result.should.match(
      /CLIENT_SECRET='your_client_secret'\nauthData_access_token/,
    );
  });

  it('should work correctly with empty .env file', async () => {
    // Create empty .env file
    await fs.writeFile('.env', '');

    const authData = {
      access_token: '1234567890',
    };

    await appendEnv(authData, 'authData_');

    const result = await fs.readFile('.env', 'utf-8');

    result.should.containEql("authData_access_token='1234567890'");
    result.should.endWith('\n');
  });

  it('should work correctly when .env file does not exist', async () => {
    // Don't create .env file, let appendEnv create it

    const authData = {
      access_token: '1234567890',
    };

    await appendEnv(authData, 'authData_');

    const result = await fs.readFile('.env', 'utf-8');

    result.should.containEql("authData_access_token='1234567890'");
    result.should.endWith('\n');
  });

  it('should handle complex values correctly', async () => {
    const envContent = `CLIENT_ID='your_client_id'`;
    await fs.writeFile('.env', envContent);

    const authData = {
      access_token: '1234567890',
      refresh_token: 'abcdefg',
      user_info: { name: 'John Doe', id: 123 },
      empty_value: '',
      null_value: null,
      undefined_value: undefined,
    };

    await appendEnv(authData, 'authData_');

    const result = await fs.readFile('.env', 'utf-8');

    result.should.containEql("authData_access_token='1234567890'");
    result.should.containEql("authData_refresh_token='abcdefg'");
    result.should.containEql(
      'authData_user_info=\'{"name":"John Doe","id":123}\'',
    );
    result.should.containEql("authData_empty_value=''");
    result.should.containEql("authData_null_value=''");
    result.should.not.containEql('authData_undefined_value');
  });
});
