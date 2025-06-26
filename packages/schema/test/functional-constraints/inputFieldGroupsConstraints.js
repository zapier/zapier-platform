'use strict';

require('should');
const schema = require('../../schema');

describe('inputFieldGroupsConstraints', () => {
  const baseDefinition = {
    version: '1.0.0',
    platformVersion: '17.2.0',
    triggers: {
      test_trigger: {
        key: 'test_trigger',
        noun: 'Test',
        display: {
          label: 'Test Trigger',
          description: 'A test trigger',
        },
        operation: {
          perform: '$func$2$f$',
          inputFields: [],
          inputFieldGroups: [],
        },
      },
    },
  };

  it('should pass when group fields reference valid inputFieldGroups', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [
              {
                key: 'contact',
                label: 'Contact Information',
                emphasize: false,
              },
              { key: 'address', label: 'Address Information' },
            ],
            inputFields: [
              { key: 'name', group: 'contact' },
              { key: 'email', group: 'contact' },
              { key: 'street', group: 'address' },
              { key: 'city', group: 'address' },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should pass when inputFields have no groups defined', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFields: [{ key: 'name' }, { key: 'email' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error when group reference does not exist in inputFieldGroups', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [
              { key: 'contact', label: 'Contact Information' },
            ],
            inputFields: [
              { key: 'name', group: 'contact' },
              { key: 'email', group: 'nonexistent' }, // This group doesn't exist
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].name.should.equal('invalidGroupReference');
    results.errors[0].message.should.match(
      /Group "nonexistent" is not defined in inputFieldGroups/,
    );
  });

  it('should error when multiple group references do not exist', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [
              { key: 'contact', label: 'Contact Information' },
            ],
            inputFields: [
              { key: 'name', group: 'contact' },
              { key: 'email', group: 'missing1' }, // This group doesn't exist
              { key: 'phone', group: 'missing2' }, // This group doesn't exist
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(2);
    results.errors.forEach((error) => {
      error.name.should.equal('invalidGroupReference');
      error.message.should.match(/is not defined in inputFieldGroups/);
    });
  });

  it('should error when groups are used in children fields', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [{ key: 'items', label: 'Item Details' }],
            inputFields: [
              {
                key: 'line_items',
                children: [
                  {
                    key: 'product',
                    group: 'items', // Groups not allowed in children
                  },
                ],
              },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].name.should.equal('groupInChildren');
    results.errors[0].message.should.match(
      /Group fields are not allowed in children fields/,
    );
  });

  it('should error when inputFieldGroups has duplicate keys', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [
              { key: 'contact', label: 'Contact Information' },
              { key: 'address', label: 'Address Information' },
              { key: 'contact', label: 'Duplicate Contact' }, // Duplicate key
            ],
            inputFields: [{ key: 'name', group: 'contact' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].name.should.equal('duplicateGroupKey');
    results.errors[0].message.should.match(
      /Duplicate group key "contact" found in inputFieldGroups/,
    );
  });

  it('should handle minimal inputFieldGroups (only key required)', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [
              { key: 'basic' }, // Only key, no label or emphasize
            ],
            inputFields: [{ key: 'name', group: 'basic' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should work across different action types (triggers, searches, creates)', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '17.2.0',
      triggers: {
        test_trigger: {
          key: 'test_trigger',
          noun: 'Test',
          display: { label: 'Test Trigger', description: 'A test trigger' },
          operation: {
            perform: '$func$2$f$',
            inputFieldGroups: [{ key: 'contact', label: 'Contact' }],
            inputFields: [{ key: 'name', group: 'contact' }],
          },
        },
      },
      searches: {
        test_search: {
          key: 'test_search',
          noun: 'Test',
          display: { label: 'Test Search', description: 'A test search' },
          operation: {
            perform: '$func$2$f$',
            inputFieldGroups: [{ key: 'search', label: 'Search Params' }],
            inputFields: [{ key: 'query', group: 'search' }],
          },
        },
      },
      creates: {
        test_create: {
          key: 'test_create',
          noun: 'Test',
          display: { label: 'Test Create', description: 'A test create' },
          operation: {
            perform: '$func$2$f$',
            inputFieldGroups: [{ key: 'data', label: 'Data Fields' }],
            inputFields: [{ key: 'title', group: 'data' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should handle undefined inputFieldGroups when no groups are referenced', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFields: [{ key: 'name' }, { key: 'email' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should handle empty inputFieldGroups when no groups are referenced', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [],
            inputFields: [{ key: 'name' }, { key: 'email' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error when referencing groups but inputFieldGroups is undefined', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFields: [{ key: 'name', group: 'contact' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].name.should.equal('invalidGroupReference');
    results.errors[0].message.should.match(
      /Group "contact" is not defined in inputFieldGroups/,
    );
  });

  it('should error when referencing groups but inputFieldGroups is empty', () => {
    const definition = {
      ...baseDefinition,
      triggers: {
        test_trigger: {
          ...baseDefinition.triggers.test_trigger,
          operation: {
            ...baseDefinition.triggers.test_trigger.operation,
            inputFieldGroups: [], // Empty but fields reference groups
            inputFields: [{ key: 'name', group: 'contact' }],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].name.should.equal('invalidGroupReference');
    results.errors[0].message.should.match(
      /Group "contact" is not defined in inputFieldGroups/,
    );
  });
});
