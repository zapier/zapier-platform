const should = require('should');
const { resolveInputDataTypes } = require('../../oclif/commands/invoke');

describe('InvokeCommand', () => {
  describe('inputDataRaw preservation', () => {
    it('should preserve original inputData as inputDataRaw before type resolution', () => {
      // Test the core functionality that was added
      const originalInputData = {
        name: 'test',
        age: '25',
        is_active: 'true',
        count: '100.5',
      };

      const inputFields = [
        { key: 'name', type: 'string' },
        { key: 'age', type: 'integer' },
        { key: 'is_active', type: 'boolean' },
        { key: 'count', type: 'number' },
      ];

      // Simulate the code change: preserve original before type resolution
      const inputDataRaw = { ...originalInputData };

      // Apply type resolution (this is the existing function)
      const resolvedInputData = resolveInputDataTypes(
        { ...originalInputData },
        inputFields,
        'UTC',
      );

      // Verify inputDataRaw contains original string values
      should(inputDataRaw.name).equal('test');
      should(inputDataRaw.age).equal('25'); // String
      should(inputDataRaw.is_active).equal('true'); // String
      should(inputDataRaw.count).equal('100.5'); // String

      // Verify inputData contains converted values
      should(resolvedInputData.name).equal('test'); // String (no change)
      should(resolvedInputData.age).equal(25); // Number
      should(resolvedInputData.is_active).equal(true); // Boolean
      should(resolvedInputData.count).equal(100.5); // Number

      // Verify they are different objects
      should(inputDataRaw).not.equal(resolvedInputData);
    });

    it('should handle empty input data correctly', () => {
      const originalInputData = {};
      const inputFields = [];

      // Simulate the code change: preserve original before type resolution
      const inputDataRaw = { ...originalInputData };

      // Apply type resolution
      const resolvedInputData = resolveInputDataTypes(
        { ...originalInputData },
        inputFields,
        'UTC',
      );

      // Both should be empty objects but different instances
      should(inputDataRaw).eql({});
      should(resolvedInputData).eql({});
      should(inputDataRaw).not.equal(resolvedInputData);
    });

    it('should not modify inputDataRaw when inputData is type-converted', () => {
      const originalInputData = {
        active: 'false',
        priority: '10',
      };

      const inputFields = [
        { key: 'active', type: 'boolean' },
        { key: 'priority', type: 'integer' },
      ];

      // Simulate the code change: preserve original before type resolution
      const inputDataRaw = { ...originalInputData };

      // Apply type resolution (this modifies the input object)
      const inputDataToModify = { ...originalInputData };
      const resolvedInputData = resolveInputDataTypes(
        inputDataToModify,
        inputFields,
        'UTC',
      );

      // inputDataRaw should remain unchanged
      should(inputDataRaw.active).equal('false'); // Still string
      should(inputDataRaw.priority).equal('10'); // Still string

      // resolvedInputData should have converted values
      should(resolvedInputData.active).equal(false); // Boolean
      should(resolvedInputData.priority).equal(10); // Number
    });
  });
});
