const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');

const tools = require('../../src/tools/exported');
const { cleanEnvironment } = require('../../src/tools/environment');
let env;

describe('read env', () => {
  let origCwd;
  let tmpDir;

  // env.inject() reads files relative to process.cwd(), so write the fixture
  // files into a fresh temp dir and run the test from there.
  const mock = (files) => {
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmpDir, name), content);
    }
  };

  beforeEach(() => {
    env = Object.assign({}, process.env);
    origCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zapier-env-test-'));
    process.chdir(tmpDir);
  });

  it('should should only read .env', () => {
    mock({
      '.environment': 'CITY="boulder"\nNAME="david"\n',
      '.env': 'PIZZA="Blackjack"\n',
      secrets: 'SECRET=very_secret_thing',
    });

    tools.env.inject();
    process.env.PIZZA.should.equal('Blackjack');
    should.not.exist(process.env.CITY);
  });

  // this is temporary in v6, removed for v7
  it('should read .environment if .env is missing', () => {
    mock({
      '.environment': 'CITY="boulder"\nNAME="david"\n',
    });

    tools.env.inject();
    process.env.CITY.should.equal('boulder');
    should.not.exist(process.env.PIZZA);
  });

  it('should parse a with filename, ignore defaults', () => {
    mock({
      '.environment': 'CITY="boulder"\nNAME="david"\n',
      '.env': 'PIZZA="Blackjack"\n',
      secrets: 'SECRET=very_secret_thing',
    });

    tools.env.inject('secrets');
    process.env.SECRET.should.equal('very_secret_thing');
    should.not.exist(process.env.CITY);
    should.not.exist(process.env.PIZZA);
  });

  afterEach(() => {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.env = env;
  });
});

describe('cleanEnvironment', () => {
  let env;

  beforeEach(() => {
    env = Object.assign({}, process.env);
  });

  afterEach(() => {
    process.env = env;
  });

  it('should clean AWS credentials when running in Lambda', () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
    process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_SESSION_TOKEN = 'test-session-token';
    process.env.AWS_SECURITY_TOKEN = 'test-security-token';

    cleanEnvironment();

    should.not.exist(process.env.AWS_ACCESS_KEY_ID);
    should.not.exist(process.env.AWS_SECRET_ACCESS_KEY);
    should.not.exist(process.env.AWS_SESSION_TOKEN);
    should.not.exist(process.env.AWS_SECURITY_TOKEN);
  });

  it('should NOT clean AWS credentials when ZAPIER_SUPPRESS_CLEAN_ENVIRONMENT is set', () => {
    process.env.ZAPIER_SUPPRESS_CLEAN_ENVIRONMENT = '1';
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
    process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_SESSION_TOKEN = 'test-session-token';
    process.env.AWS_SECURITY_TOKEN = 'test-security-token';

    cleanEnvironment();

    process.env.AWS_ACCESS_KEY_ID.should.equal('test-key-id');
    process.env.AWS_SECRET_ACCESS_KEY.should.equal('test-secret');
    process.env.AWS_SESSION_TOKEN.should.equal('test-session-token');
    process.env.AWS_SECURITY_TOKEN.should.equal('test-security-token');
  });

  it('should always clean Zapier-specific env vars regardless of suppress flag', () => {
    process.env.ZAPIER_SUPPRESS_CLEAN_ENVIRONMENT = '1';
    process.env._ZAPIER_ONE_TIME_SECRET = 'secret-value';

    cleanEnvironment();

    should.not.exist(process.env._ZAPIER_ONE_TIME_SECRET);
  });
});
