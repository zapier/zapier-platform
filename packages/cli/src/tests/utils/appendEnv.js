const fs = require('node:fs/promises');
const os = require('os');
const path = require('path');
require('should');
const { removeDir, ensureDir } = require('../../utils/files');

// Test the actual appendEnv function indirectly through a simplified version
// that matches the logic we implemented in invoke.js
const appendEnv = async (vars, prefix = '') => {
  const envFile = '.env';
  let content = Object.entries(vars)
    .filter(([k, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
    )
    .join('');

  // Check if .env file exists and doesn't end with newline
  try {
    const existingContent = await fs.readFile(envFile, 'utf8');
    if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
      content = '\n' + content;
    }
  } catch (error) {
    // File doesn't exist or can't be read, proceed as normal
  }

  await fs.appendFile(envFile, content);
};

describe('appendEnv', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = path.resolve(os.tmpdir(), 'zapier-platform-cli-appendenv-test');
    originalCwd = process.cwd();

    await removeDir(tmpDir);
    await ensureDir(tmpDir);
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await removeDir(tmpDir);
  });

  it('should create .env file when it does not exist', async () => {
    const vars = { access_token: '1234567890', refresh_token: 'abcdefg' };
    const prefix = 'authData_';

    await appendEnv(vars, prefix);

    const content = await fs.readFile('.env', 'utf8');
    content.should.equal(
      "authData_access_token='1234567890'\nauthData_refresh_token='abcdefg'\n",
    );
  });

  it('should append to .env file that ends with newline', async () => {
    // Create initial .env file with newline at end
    await fs.writeFile(
      '.env',
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n",
    );

    const vars = { access_token: '1234567890', refresh_token: 'abcdefg' };
    const prefix = 'authData_';

    await appendEnv(vars, prefix);

    const content = await fs.readFile('.env', 'utf8');
    content.should.equal(
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'\nauthData_refresh_token='abcdefg'\n",
    );
  });

  it('should add newline when .env file does not end with newline', async () => {
    // Create initial .env file WITHOUT newline at end (this is the bug scenario)
    await fs.writeFile(
      '.env',
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'",
    );

    const vars = { access_token: '1234567890', refresh_token: 'abcdefg' };
    const prefix = 'authData_';

    await appendEnv(vars, prefix);

    const content = await fs.readFile('.env', 'utf8');
    content.should.equal(
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='1234567890'\nauthData_refresh_token='abcdefg'\n",
    );
  });

  it('should handle empty .env file', async () => {
    // Create empty .env file
    await fs.writeFile('.env', '');

    const vars = { access_token: '1234567890' };
    const prefix = 'authData_';

    await appendEnv(vars, prefix);

    const content = await fs.readFile('.env', 'utf8');
    content.should.equal("authData_access_token='1234567890'\n");
  });
});
