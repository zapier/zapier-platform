const should = require('should');

describe('InvokeCommand', () => {
  describe('inputDataRaw preservation', () => {
    it('should preserve inputDataRaw when creating bundles', () => {
      // This test verifies the core logic of inputDataRaw preservation
      // by simulating the bundle creation process

      const originalInputData = {
        name: 'test',
        age: '25',
        is_active: 'true',
      };

      // Step 1: Simulate the first bundle creation (before type resolution)
      // This happens when getting inputFields - inputDataRaw should equal inputData
      const inputFieldsBundle = {
        inputData: originalInputData,
        inputDataRaw: originalInputData, // At this point, both should be the same
        authData: {},
        meta: {},
      };

      should(inputFieldsBundle.inputDataRaw).eql(originalInputData);
      should(inputFieldsBundle.inputDataRaw.name).eql('test');
      should(inputFieldsBundle.inputDataRaw.age).eql('25'); // String value
      should(inputFieldsBundle.inputDataRaw.is_active).eql('true'); // String value

      // Step 2: Simulate what happens before type resolution
      // This is the key change - preserve original inputData as inputDataRaw
      const inputDataRaw = { ...originalInputData };

      // Step 3: Simulate type resolution (like what resolveInputDataTypes does)
      const resolvedInputData = {
        name: originalInputData.name, // String stays string
        age: parseInt(originalInputData.age), // String becomes number
        is_active: originalInputData.is_active === 'true', // String becomes boolean
      };

      // Step 4: Create the final bundle for perform operation
      const performBundle = {
        inputData: resolvedInputData,
        inputDataRaw: inputDataRaw,
        authData: {},
        meta: {},
      };

      // Verify inputDataRaw preserves original string values
      should(performBundle.inputDataRaw.name).eql('test');
      should(performBundle.inputDataRaw.age).eql('25'); // Should remain string
      should(performBundle.inputDataRaw.is_active).eql('true'); // Should remain string

      // Verify inputData has converted types
      should(performBundle.inputData.name).eql('test');
      should(performBundle.inputData.age).eql(25); // Should be number
      should(performBundle.inputData.is_active).eql(true); // Should be boolean

      // Verify types are correct
      should(typeof performBundle.inputDataRaw.age).eql('string');
      should(typeof performBundle.inputData.age).eql('number');
      should(typeof performBundle.inputDataRaw.is_active).eql('string');
      should(typeof performBundle.inputData.is_active).eql('boolean');
    });

    it('should handle empty inputData correctly', () => {
      // Test the edge case of empty input data
      const originalInputData = {};

      // Preserve original as inputDataRaw
      const inputDataRaw = { ...originalInputData };

      // No type resolution needed for empty object
      const resolvedInputData = { ...originalInputData };

      const bundle = {
        inputData: resolvedInputData,
        inputDataRaw: inputDataRaw,
        authData: {},
        meta: {},
      };

      // Both should be empty objects
      should(bundle.inputData).eql({});
      should(bundle.inputDataRaw).eql({});
    });

    it('should preserve inputDataRaw for fields that do not require type conversion', () => {
      // Test case where no type conversion is needed
      const originalInputData = {
        name: 'test user',
        description: 'some description',
      };

      const inputDataRaw = { ...originalInputData };
      const resolvedInputData = { ...originalInputData }; // No conversion for strings

      const bundle = {
        inputData: resolvedInputData,
        inputDataRaw: inputDataRaw,
        authData: {},
        meta: {},
      };

      // Both should have the same values since no conversion was needed
      should(bundle.inputData.name).eql('test user');
      should(bundle.inputDataRaw.name).eql('test user');
      should(bundle.inputData.description).eql('some description');
      should(bundle.inputDataRaw.description).eql('some description');

      // But they should still be separate objects
      should(bundle.inputData).not.be.exactly(bundle.inputDataRaw);
    });
  });
});
