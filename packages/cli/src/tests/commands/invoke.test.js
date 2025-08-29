const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const should = require('should');

// Import the exported appendEnv function for testing
const { _appendEnv: appendEnv } = require('../../oclif/commands/invoke');

const setupTempWorkingDir = () => {
  let workdir;
  const tmpBaseDir = os.tmpdir();
  while (!workdir || fs.existsSync(workdir)) {
    workdir = path.join(tmpBaseDir, crypto.randomBytes(20).toString('hex'));
  }
  fs.mkdirSync(workdir);
  return workdir;
};

describe('InvokeCommand', () => {
  let tempWorkingDir;
  let originalCwd;

  beforeEach(() => {
    tempWorkingDir = setupTempWorkingDir();
    originalCwd = process.cwd();
    process.chdir(tempWorkingDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.removeSync(tempWorkingDir);
  });

  describe('appendEnv function', () => {
    it('should create .env file when it does not exist', async () => {
      const vars = { access_token: '12345', refresh_token: 'abcde' };
      const prefix = 'authData_';

      await appendEnv(vars, prefix);

      const envContent = fs.readFileSync('.env', 'utf8');
      should(envContent).eql(
        "authData_access_token='12345'\nauthData_refresh_token='abcde'\n",
      );
    });

    it('should append to .env file when it ends with newline', async () => {
      // Create initial .env file with newline
      fs.writeFileSync(
        '.env',
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\n",
      );

      const vars = { access_token: '12345', refresh_token: 'abcde' };
      const prefix = 'authData_';

      await appendEnv(vars, prefix);

      const envContent = fs.readFileSync('.env', 'utf8');
      const expected =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='12345'\nauthData_refresh_token='abcde'\n";
      should(envContent).eql(expected);
    });

    it('should add newline before appending when .env file does not end with newline', async () => {
      // Create initial .env file WITHOUT trailing newline (this is the bug scenario)
      fs.writeFileSync(
        '.env',
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'",
      );

      const vars = { access_token: '12345', refresh_token: 'abcde' };
      const prefix = 'authData_';

      await appendEnv(vars, prefix);

      const envContent = fs.readFileSync('.env', 'utf8');
      // This test should fail with current implementation - showing the bug
      const expected =
        "CLIENT_ID='your_client_id'\nCLIENT_SECRET='your_client_secret'\nauthData_access_token='12345'\nauthData_refresh_token='abcde'\n";
      should(envContent).eql(expected);
    });

    it('should handle empty variables object', async () => {
      fs.writeFileSync('.env', "CLIENT_ID='your_client_id'\n");

      const vars = {};
      const prefix = 'authData_';

      await appendEnv(vars, prefix);

      const envContent = fs.readFileSync('.env', 'utf8');
      should(envContent).eql("CLIENT_ID='your_client_id'\n");
    });

    it('should filter out undefined values', async () => {
      const vars = {
        access_token: '12345',
        refresh_token: undefined,
        user_id: 'user123',
      };
      const prefix = 'authData_';

      await appendEnv(vars, prefix);

      const envContent = fs.readFileSync('.env', 'utf8');
      should(envContent).eql(
        "authData_access_token='12345'\nauthData_user_id='user123'\n",
      );
    });
  });
});
