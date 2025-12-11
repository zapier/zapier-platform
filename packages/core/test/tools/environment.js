const should = require('should');
const mock = require('mock-fs');

const tools = require('../../src/tools/exported');
const environmentTools = require('../../src/tools/environment');
const createLambdaHandler = require('../../src/tools/create-lambda-handler');
let env;

describe('read env', () => {
  beforeEach(() => {
    env = Object.assign({}, process.env);
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
    mock.restore();
    process.env = env;
  });
});

describe('environment cleanup', () => {
  let env;

  beforeEach(() => {
    env = Object.assign({}, process.env);
  });

  afterEach(() => {
    process.env = env;
  });

  it('should apply environment variables from event', () => {
    // Clean up any existing test vars
    delete process.env.TEST_VAR_1;
    delete process.env.TEST_VAR_2;

    const event = {
      bundle: {},
      environment: {
        TEST_VAR_1: 'value1',
        TEST_VAR_2: 'value2',
      },
    };

    should.not.exist(process.env.TEST_VAR_1);
    should.not.exist(process.env.TEST_VAR_2);

    environmentTools.applyEnvironment(event);

    process.env.TEST_VAR_1.should.equal('value1');
    process.env.TEST_VAR_2.should.equal('value2');
  });

  it('should clean up applied environment variables', () => {
    // Clean up any existing test vars
    delete process.env.TEST_VAR_1;
    delete process.env.TEST_VAR_2;
    delete process.env.TEST_VAR_3;

    const event = {
      bundle: {},
      environment: {
        TEST_VAR_1: 'value1',
        TEST_VAR_2: 'value2',
        TEST_VAR_3: 'value3',
      },
    };

    // Apply environment variables
    environmentTools.applyEnvironment(event);

    process.env.TEST_VAR_1.should.equal('value1');
    process.env.TEST_VAR_2.should.equal('value2');
    process.env.TEST_VAR_3.should.equal('value3');

    // Clean up with event
    environmentTools.cleanEnvironment(event);

    // Variables should be removed
    should.not.exist(process.env.TEST_VAR_1);
    should.not.exist(process.env.TEST_VAR_2);
    should.not.exist(process.env.TEST_VAR_3);
  });

  it('should not remove other environment variables during cleanup', () => {
    // Set some pre-existing env vars
    process.env.EXISTING_VAR = 'existing_value';
    process.env.ANOTHER_VAR = 'another_value';

    const event = {
      bundle: {},
      environment: {
        TEST_VAR_1: 'value1',
        TEST_VAR_2: 'value2',
      },
    };

    // Apply environment variables
    environmentTools.applyEnvironment(event);

    // Clean up with event
    environmentTools.cleanEnvironment(event);

    // Applied vars should be removed
    should.not.exist(process.env.TEST_VAR_1);
    should.not.exist(process.env.TEST_VAR_2);

    // Pre-existing vars should remain
    process.env.EXISTING_VAR.should.equal('existing_value');
    process.env.ANOTHER_VAR.should.equal('another_value');
  });

  it('should handle multiple invocations without cross-contamination', () => {
    // Clean up any existing test vars
    delete process.env.INVOCATION_ID;
    delete process.env.USER_ID;
    delete process.env.ACCOUNT_ID;

    // First invocation
    const event1 = {
      bundle: {},
      environment: {
        INVOCATION_ID: 'invocation-1',
        USER_ID: 'user-123',
      },
    };

    environmentTools.applyEnvironment(event1);
    process.env.INVOCATION_ID.should.equal('invocation-1');
    process.env.USER_ID.should.equal('user-123');

    // Clean up first invocation
    environmentTools.cleanEnvironment(event1);
    should.not.exist(process.env.INVOCATION_ID);
    should.not.exist(process.env.USER_ID);

    // Second invocation (simulating Lambda container reuse)
    const event2 = {
      bundle: {},
      environment: {
        INVOCATION_ID: 'invocation-2',
        ACCOUNT_ID: 'account-456',
      },
    };

    environmentTools.applyEnvironment(event2);
    process.env.INVOCATION_ID.should.equal('invocation-2');
    process.env.ACCOUNT_ID.should.equal('account-456');

    // Verify no contamination from first invocation
    should.not.exist(process.env.USER_ID);

    // Clean up second invocation
    environmentTools.cleanEnvironment(event2);
    should.not.exist(process.env.INVOCATION_ID);
    should.not.exist(process.env.ACCOUNT_ID);
  });

  it('should handle cleanEnvironment without event parameter', () => {
    // Set AWS env vars that should be cleaned
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
    process.env.AWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env._ZAPIER_ONE_TIME_SECRET = 'onetimesecret';

    // Clean without event (should only clean AWS and Zapier-specific vars)
    environmentTools.cleanEnvironment();

    // AWS keys should be removed
    should.not.exist(process.env.AWS_ACCESS_KEY_ID);
    should.not.exist(process.env.AWS_SECRET_ACCESS_KEY);
    should.not.exist(process.env._ZAPIER_ONE_TIME_SECRET);

    // Lambda function name should remain
    process.env.AWS_LAMBDA_FUNCTION_NAME.should.equal('test-function');
  });

  it('should clean environment variables in Lambda handler after invocation', async () => {
    // Clean up any existing test vars
    delete process.env.LAMBDA_INVOCATION_VAR;
    delete process.env.ANOTHER_INVOCATION_VAR;

    // Create a simple app
    const appDefinition = {
      version: require('../../package.json').version,
      platformVersion: require('../../package.json').version,
      triggers: {
        test: {
          key: 'test',
          noun: 'Test',
          display: {
            label: 'Test Trigger',
            description: 'Test trigger',
          },
          operation: {
            perform: (z, bundle) => {
              // Verify env vars are available during execution
              if (!process.env.LAMBDA_INVOCATION_VAR) {
                throw new Error(
                  'Environment variable not available during execution',
                );
              }
              return [{ id: 1, value: process.env.LAMBDA_INVOCATION_VAR }];
            },
          },
        },
      },
    };

    const handler = createLambdaHandler(appDefinition);

    const event = {
      command: 'execute',
      bundle: {},
      environment: {
        LAMBDA_INVOCATION_VAR: 'test_value_123',
        ANOTHER_INVOCATION_VAR: 'another_value_456',
      },
      method: 'triggers.test.operation.perform',
    };

    // Verify env vars don't exist before invocation
    should.not.exist(process.env.LAMBDA_INVOCATION_VAR);
    should.not.exist(process.env.ANOTHER_INVOCATION_VAR);

    // Execute handler
    const result = await handler(event);

    // Verify handler executed successfully
    result.should.have.property('results');
    result.results.should.be.an.Array();
    result.results[0].id.should.equal(1);
    result.results[0].value.should.equal('test_value_123');

    // Wait for the finally block to complete (it runs asynchronously after resolve)
    await new Promise((resolve) => setImmediate(resolve));

    // Verify env vars are cleaned up by the finally block in the Lambda handler
    should.not.exist(process.env.LAMBDA_INVOCATION_VAR);
    should.not.exist(process.env.ANOTHER_INVOCATION_VAR);
  });

  it('should clean environment variables even when Lambda handler throws error', async () => {
    // Clean up any existing test vars
    delete process.env.ERROR_TEST_VAR;

    // Create an app that throws an error
    const appDefinition = {
      version: require('../../package.json').version,
      platformVersion: require('../../package.json').version,
      triggers: {
        test: {
          key: 'test',
          noun: 'Test',
          display: {
            label: 'Test Trigger',
            description: 'Test trigger',
          },
          operation: {
            perform: () => {
              throw new Error('Intentional error for testing');
            },
          },
        },
      },
    };

    const handler = createLambdaHandler(appDefinition);

    const event = {
      command: 'execute',
      bundle: {},
      environment: {
        ERROR_TEST_VAR: 'should_be_cleaned',
      },
      method: 'triggers.test.operation.perform',
    };

    // Verify env var doesn't exist before invocation
    should.not.exist(process.env.ERROR_TEST_VAR);

    // Execute handler (should throw)
    try {
      await handler(event);
      throw new Error('Handler should have thrown an error');
    } catch (err) {
      err.message.should.containEql('Intentional error for testing');
    }

    // Wait for the finally block to complete (it runs asynchronously after reject)
    await new Promise((resolve) => setImmediate(resolve));

    // Verify env var is cleaned up even after error by the finally block
    should.not.exist(process.env.ERROR_TEST_VAR);
  });
});
