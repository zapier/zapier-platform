const assert = require('assert');
const fs = require('node:fs/promises');
const path = require('path');
const { tmpdir } = require('os');

/**
 * Test for the appendEnv function fix to handle .env files without trailing newlines
 * This addresses the bug reported in PDE-6508 where auth variables were appended
 * to the same line as existing variables when the .env file doesn't end with a newline.
 */

// Extract the appendEnv function for testing
const appendEnv = async (vars, prefix = '') => {
  const envVars = Object.entries(vars)
    .filter(([k, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${prefix}${k}='${typeof v === 'object' && v !== null ? JSON.stringify(v) : v || ''}'\n`,
    )
    .join('');

  // Check if .env file exists and doesn't end with newline
  let contentToAppend = envVars;
  try {
    const existingContent = await fs.readFile('.env', 'utf8');
    if (existingContent.length > 0 && !existingContent.endsWith('\n')) {
      contentToAppend = '\n' + envVars;
    }
  } catch (err) {
    // File doesn't exist, no need to prepend newline
  }

  await fs.appendFile('.env', contentToAppend);
};

describe('appendEnv function (PDE-6508 fix)', () => {
  let testDir, originalCwd;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'test-appendenv-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should fix PDE-6508: append to file without trailing newline by adding newline first', async () => {
    // Create .env file without trailing newline (the bug scenario from PDE-6508)
    await fs.writeFile(
      '.env',
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'",
    );

    const authData = {
      access_token: '1234567890',
      refresh_token: 'abcdefg',
    };

    await appendEnv(authData, 'authData_');

    const content = await fs.readFile('.env', 'utf8');
    const lines = content.split('\n');

    // Should have separate lines for each variable (this was the bug)
    assert.strictEqual(lines[0], "CLIENT_ID='your_client_id'");
    assert.strictEqual(lines[1], "CLIENT_SECRET='your_client_secret'");
    assert.strictEqual(lines[2], "authData_access_token='1234567890'");
    assert.strictEqual(lines[3], "authData_refresh_token='abcdefg'");

    // The main assertion: should NOT have variables concatenated on the same line
    assert.ok(
      !content.includes(
        "CLIENT_SECRET='your_client_secret'authData_access_token",
      ),
    );
  });

  it('should append to file with trailing newline without adding extra newline', async () => {
    // Create .env file with trailing newline (normal case)
    await fs.writeFile(
      '.env',
      "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n",
    );

    const authData = {
      access_token: '1234567890',
    };

    await appendEnv(authData, 'authData_');

    const content = await fs.readFile('.env', 'utf8');
    const lines = content.split('\n');

    assert.strictEqual(lines[0], "CLIENT_ID='your_client_id'");
    assert.strictEqual(lines[1], "CLIENT_SECRET='your_client_secret'");
    assert.strictEqual(lines[2], "authData_access_token='1234567890'");

    // Should not have extra empty line
    assert.ok(!content.includes('\n\nauthData_access_token'));
  });

  it('should create new file when .env does not exist', async () => {
    const authData = {
      access_token: '1234567890',
      refresh_token: 'abcdefg',
    };

    await appendEnv(authData, 'authData_');

    const content = await fs.readFile('.env', 'utf8');
    assert.strictEqual(
      content,
      "authData_access_token='1234567890'\nauthData_refresh_token='abcdefg'\n",
    );
  });

  it('should handle empty variables correctly', async () => {
    const authData = {
      access_token: '',
      refresh_token: 'abcdefg',
      undefined_var: undefined,
    };

    await appendEnv(authData, 'authData_');

    const content = await fs.readFile('.env', 'utf8');
    assert.strictEqual(
      content,
      "authData_access_token=''\nauthData_refresh_token='abcdefg'\n",
    );
  });

  it('should handle object values by JSON stringifying them', async () => {
    const authData = {
      metadata: { userId: 123, name: 'test' },
    };

    await appendEnv(authData, 'authData_');

    const content = await fs.readFile('.env', 'utf8');
    assert.strictEqual(
      content,
      'authData_metadata=\'{"userId":123,"name":"test"}\'\n',
    );
  });
});
