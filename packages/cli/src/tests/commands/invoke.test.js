const should = require('should');
const sinon = require('sinon');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

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
  let tempAppDir;
  let command;
  let localAppCommandStub;
  let InvokeCommand;
  
  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
    
    // Mock localAppCommand first since localAppCommandWithRelayErrorHandler calls it
    const localUtilsModule = require('../../utils/local');
    localAppCommandStub = sinon.stub(localUtilsModule, 'localAppCommand');
    
    // Now require the InvokeCommand after setting up the mocks
    InvokeCommand = require('../../oclif/commands/invoke');
    command = new InvokeCommand();
    command.nonInteractive = true; // Avoid prompts in tests
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
    sinon.restore();
  });

  describe('inputDataRaw preservation in invokeAction', () => {
    it('should preserve inputDataRaw with original string values while converting inputData types', async () => {
      // Set up test data
      const originalInputData = {
        name: 'test',
        age: '25',
        is_active: 'true',
      };
      
      const inputFields = [
        { key: 'name', type: 'string' },
        { key: 'age', type: 'integer' },
        { key: 'is_active', type: 'boolean' },
      ];
      
      const appDefinition = {
        creates: {
          test_create: {
            operation: {
              inputFields: inputFields,
              perform: () => {},
            },
          },
        },
      };
      
      const action = appDefinition.creates.test_create;
      
      // Mock localAppCommand to return inputFields first, then capture the perform bundle
      let performBundleData = null;
      localAppCommandStub
        .onFirstCall()
        .resolves(inputFields) // Return inputFields for the first call
        .onSecondCall()
        .callsFake((args) => {
          if (args.method && args.method.includes('perform')) {
            performBundleData = args.bundle; // Capture the bundle for verification
          }
          return Promise.resolve([{ id: 1 }]);
        });
      
      // Call the method under test
      await command.invokeAction(
        appDefinition,
        'creates',
        action,
        { ...originalInputData }, // Copy to avoid mutation
        null, // authId
        {}, // authData
        {}, // meta
        'UTC', // timezone
        {}, // zcacheTestObj
        {}, // cursorTestObj
        'testAppId',
        'testDeployKey'
      );
      
      // Verify the bundle was created correctly
      should(performBundleData).be.ok();
      should(performBundleData.inputData).be.ok();
      should(performBundleData.inputDataRaw).be.ok();
      
      // Verify inputDataRaw preserves original string values
      should(performBundleData.inputDataRaw.name).eql('test');
      should(performBundleData.inputDataRaw.age).eql('25'); // Should remain string
      should(performBundleData.inputDataRaw.is_active).eql('true'); // Should remain string
      should(typeof performBundleData.inputDataRaw.age).eql('string');
      should(typeof performBundleData.inputDataRaw.is_active).eql('string');
      
      // Verify inputData has converted types  
      should(performBundleData.inputData.name).eql('test');
      should(performBundleData.inputData.age).eql(25); // Should be converted to number
      should(performBundleData.inputData.is_active).eql(true); // Should be converted to boolean
      should(typeof performBundleData.inputData.age).eql('number');
      should(typeof performBundleData.inputData.is_active).eql('boolean');
    });

    it('should handle empty inputData correctly', async () => {
      const originalInputData = {};
      const inputFields = [];
      
      const appDefinition = {
        creates: {
          test_create: {
            operation: {
              inputFields: inputFields,
              perform: () => {},
            },
          },
        },
      };
      
      const action = appDefinition.creates.test_create;
      
      let performBundleData = null;
      localAppCommandStub
        .onFirstCall()
        .resolves(inputFields)
        .onSecondCall()
        .callsFake((args) => {
          if (args.method && args.method.includes('perform')) {
            performBundleData = args.bundle;
          }
          return Promise.resolve([]);
        });
      
      await command.invokeAction(
        appDefinition,
        'creates',
        action,
        { ...originalInputData },
        null,
        {},
        {},
        'UTC',
        {},
        {},
        'testAppId',
        'testDeployKey'
      );
      
      // Both should be empty objects
      should(performBundleData.inputData).eql({});
      should(performBundleData.inputDataRaw).eql({});
    });

    it('should preserve inputDataRaw when no type conversion is needed', async () => {
      const originalInputData = {
        name: 'test user',
        description: 'some description',
      };
      
      const inputFields = [
        { key: 'name', type: 'string' },
        { key: 'description', type: 'string' },
      ];
      
      const appDefinition = {
        creates: {
          test_create: {
            operation: {
              inputFields: inputFields,
              perform: () => {},
            },
          },
        },
      };
      
      const action = appDefinition.creates.test_create;
      
      let performBundleData = null;
      localAppCommandStub
        .onFirstCall()
        .resolves(inputFields)
        .onSecondCall()
        .callsFake((args) => {
          if (args.method && args.method.includes('perform')) {
            performBundleData = args.bundle;
          }
          return Promise.resolve([{ id: 1 }]);
        });
      
      await command.invokeAction(
        appDefinition,
        'creates',
        action,
        { ...originalInputData },
        null,
        {},
        {},
        'UTC',
        {},
        {},
        'testAppId',
        'testDeployKey'
      );
      
      // Both should have the same values since no conversion was needed
      should(performBundleData.inputData.name).eql('test user');
      should(performBundleData.inputDataRaw.name).eql('test user');
      should(performBundleData.inputData.description).eql('some description');
      should(performBundleData.inputDataRaw.description).eql('some description');
      
      // But they should still be separate objects
      should(performBundleData.inputData).not.be.exactly(performBundleData.inputDataRaw);
    });
  });
});
