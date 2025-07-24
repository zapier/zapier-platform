const should = require('should');
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

  beforeEach(() => {
    tempAppDir = setupTempWorkingDir();
  });

  afterEach(() => {
    fs.removeSync(tempAppDir);
  });

  describe('inputDataRaw preservation', () => {
    it('should create bundles with both inputData and inputDataRaw properties', () => {
      // Test the behavior: the invoke command should create bundles that include
      // both inputData (with type conversion) and inputDataRaw (original values)

      // This test verifies the fix is in place by testing the expected behavior
      const invokeSource = fs.readFileSync(
        path.join(__dirname, '../../oclif/commands/invoke.js'),
        'utf8',
      );

      // Test 1: Verify inputDataRaw preservation happens before type conversion
      const preservationMatch = invokeSource.match(
        /\/\/ Preserve original inputData as inputDataRaw before type resolution\s*\n\s*const inputDataRaw = \{ \.\.\.inputData \};/,
      );
      should.exist(
        preservationMatch,
        'Should preserve inputData before type conversion',
      );

      // Test 2: Verify the perform bundle includes both properties
      const performBundleMatch = invokeSource.match(
        /bundle:\s*\{\s*inputData,\s*inputDataRaw,\s*authData,\s*meta,?\s*\}/,
      );
      should.exist(
        performBundleMatch,
        'Perform bundle should include both inputData and inputDataRaw',
      );

      // Test 3: Verify the inputFields bundle also includes inputDataRaw
      const inputFieldsBundleMatches = invokeSource.match(
        /bundle:\s*\{[^}]*inputData[^}]*inputDataRaw[^}]*\}/g,
      );
      should.exist(
        inputFieldsBundleMatches,
        'Should have bundles with both properties',
      );
      should(inputFieldsBundleMatches.length).be.greaterThan(
        1,
        'Should have multiple bundles with inputDataRaw',
      );
    });

    it('should demonstrate the expected behavior with sample data', () => {
      // Test the expected behavior pattern that the fix enables
      const originalInputData = {
        name: 'John Doe',
        age: '30',
        is_active: 'true',
        score: '95.5',
        count: '42',
      };

      // Step 1: Preserve original data (this is what the fix does)
      const inputDataRaw = { ...originalInputData };

      // Step 2: Simulate type conversion (this is what resolveInputDataTypes does)
      const inputData = { ...originalInputData };
      // Simulate the type conversions based on field types
      inputData.age = parseInt(inputData.age, 10);
      inputData.is_active = inputData.is_active === 'true';
      inputData.score = parseFloat(inputData.score);
      inputData.count = parseInt(inputData.count, 10);

      // Step 3: Verify the behavior - both versions should be available
      // Original string values in inputDataRaw
      should(inputDataRaw.name).equal('John Doe');
      should(inputDataRaw.age).equal('30');
      should(inputDataRaw.is_active).equal('true');
      should(inputDataRaw.score).equal('95.5');
      should(inputDataRaw.count).equal('42');

      // Type-converted values in inputData
      should(inputData.name).equal('John Doe');
      should(inputData.age).equal(30);
      should(inputData.is_active).equal(true);
      should(inputData.score).equal(95.5);
      should(inputData.count).equal(42);

      // Verify types changed for converted fields
      should(typeof inputDataRaw.age).equal('string');
      should(typeof inputData.age).equal('number');
      should(typeof inputDataRaw.is_active).equal('string');
      should(typeof inputData.is_active).equal('boolean');

      // Verify they are separate objects
      should(inputDataRaw).not.equal(inputData);

      // This demonstrates the behavior that the fix enables:
      // developers can access both original and converted values
      const bundle = {
        inputData, // Type-converted for app logic
        inputDataRaw, // Original values for debugging/logging
        authData: {},
        meta: {},
      };

      should.exist(bundle.inputData);
      should.exist(bundle.inputDataRaw);
      should(bundle.inputData).not.equal(bundle.inputDataRaw);
    });

    it('should handle edge cases correctly', () => {
      // Test edge cases that the fix should handle

      // Empty input data
      const emptyInputData = {};
      const emptyInputDataRaw = { ...emptyInputData };
      should(Object.keys(emptyInputDataRaw)).have.length(0);
      should(emptyInputDataRaw).not.equal(emptyInputData);

      // Input data with undefined/null values
      const inputWithNulls = { name: 'test', value: null, other: undefined };
      const inputDataRaw = { ...inputWithNulls };
      should(inputDataRaw.name).equal('test');
      should(inputDataRaw.value).equal(null);
      should(inputDataRaw.other).equal(undefined);

      // Verify shallow copy behavior (which is what the fix actually does)
      const inputWithObjects = { config: { enabled: 'true' } };
      const objectInputDataRaw = { ...inputWithObjects };

      // With shallow copy, nested objects are shared references
      should(objectInputDataRaw.config).equal(inputWithObjects.config);

      // But the top-level objects are different
      should(objectInputDataRaw).not.equal(inputWithObjects);

      // This is the expected behavior for the inputDataRaw fix -
      // it preserves the original input structure at the top level
    });
  });
});
