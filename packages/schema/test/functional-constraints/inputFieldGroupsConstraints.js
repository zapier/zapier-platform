'use strict';

require('should');
const schema = require('../../schema');

describe('inputFieldGroupsConstraints', () => {
  const baseDefinition = {
    version: '1.0.0',
    platformVersion: '17.2.0',
  };

  describe('Action Types Validation', () => {
    it('should pass when group fields reference valid inputFieldGroups in triggers', () => {
      const definition = {
        ...baseDefinition,
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

    it('should error when group reference does not exist in inputFieldGroups', () => {
      const definition = {
        ...baseDefinition,
        searches: {
          test_search: {
            key: 'test_search',
            type: 'search',
            noun: 'Test',
            display: {
              label: 'Test Search',
              description: 'A test search',
            },
            operation: {
              perform: '$func$2$f$',
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

    it('should error when groups are used in children fields', () => {
      const definition = {
        ...baseDefinition,
        creates: {
          test_create: {
            key: 'test_create',
            type: 'create',
            noun: 'Test',
            display: {
              label: 'Test Create',
              description: 'A test create',
            },
            operation: {
              perform: '$func$2$f$',
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
            key: 'test_trigger',
            noun: 'Test',
            display: {
              label: 'Test Trigger',
              description: 'A test trigger',
            },
            operation: {
              perform: '$func$2$f$',
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
  });

  describe('Resources Validation', () => {
    it('should pass when resource methods have valid group references', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            list: {
              display: {
                label: 'List Contacts',
                description: 'List all contacts',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [{ key: 'filter', label: 'Filter Options' }],
                inputFields: [
                  { key: 'status', group: 'filter' },
                  { key: 'type', group: 'filter' },
                ],
              },
            },
            create: {
              display: {
                label: 'Create Contact',
                description: 'Create a new contact',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [
                  { key: 'personal', label: 'Personal Info' },
                  { key: 'business', label: 'Business Info' },
                ],
                inputFields: [
                  { key: 'firstName', group: 'personal' },
                  { key: 'lastName', group: 'personal' },
                  { key: 'company', group: 'business' },
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should error when resource method has invalid group reference', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            search: {
              display: {
                label: 'Search Contacts',
                description: 'Search for contacts',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [
                  { key: 'criteria', label: 'Search Criteria' },
                ],
                inputFields: [
                  { key: 'name', group: 'criteria' },
                  { key: 'email', group: 'invalid_group' }, // Invalid group reference
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('invalidGroupReference');
      results.errors[0].message.should.match(
        /Group "invalid_group" is not defined in inputFieldGroups/,
      );
      results.errors[0].property.should.equal(
        'instance.resources.contact.search.operation.inputFields[1].group',
      );
    });

    it('should error when resource method has duplicate group keys', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          project: {
            key: 'project',
            noun: 'Project',
            get: {
              display: {
                label: 'Get Project',
                description: 'Get a project by ID',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [
                  { key: 'options', label: 'Options' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'options', label: 'Duplicate Options' }, // Duplicate key
                ],
                inputFields: [{ key: 'includeArchived', group: 'options' }],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('duplicateGroupKey');
      results.errors[0].message.should.match(
        /Duplicate group key "options" found in inputFieldGroups/,
      );
      results.errors[0].property.should.equal(
        'instance.resources.project.get.operation.inputFieldGroups[2].key',
      );
    });

    it('should error when resource method has groups in children fields', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          order: {
            key: 'order',
            noun: 'Order',
            create: {
              display: {
                label: 'Create Order',
                description: 'Create a new order',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [{ key: 'items', label: 'Order Items' }],
                inputFields: [
                  {
                    key: 'lineItems',
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
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('groupInChildren');
      results.errors[0].message.should.match(
        /Group fields are not allowed in children fields/,
      );
      results.errors[0].property.should.equal(
        'instance.resources.order.create.operation.inputFields[0].children[0].group',
      );
    });

    it('should validate multiple resource methods independently', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          user: {
            key: 'user',
            noun: 'User',
            list: {
              display: {
                label: 'List Users',
                description: 'List all users',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [{ key: 'filter', label: 'Filter Options' }],
                inputFields: [{ key: 'active', group: 'filter' }],
              },
            },
            search: {
              display: {
                label: 'Search Users',
                description: 'Search for users',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [
                  { key: 'criteria', label: 'Search Criteria' },
                ],
                inputFields: [
                  { key: 'email', group: 'nonexistent' }, // Invalid reference
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('invalidGroupReference');
      results.errors[0].property.should.equal(
        'instance.resources.user.search.operation.inputFields[0].group',
      );
    });
  });

  describe('Mixed Validation', () => {
    it('should validate both action types and resources together', () => {
      const definition = {
        ...baseDefinition,
        triggers: {
          user_trigger: {
            key: 'user_trigger',
            noun: 'User',
            display: {
              label: 'User Trigger',
              description: 'Trigger on user events',
            },
            operation: {
              perform: '$func$2$f$',
              inputFieldGroups: [{ key: 'filter', label: 'Filter' }],
              inputFields: [{ key: 'status', group: 'filter' }],
            },
          },
        },
        resources: {
          contact: {
            key: 'contact',
            noun: 'Contact',
            create: {
              display: {
                label: 'Create Contact',
                description: 'Create a new contact',
              },
              operation: {
                perform: '$func$2$f$',
                inputFieldGroups: [{ key: 'personal', label: 'Personal Info' }],
                inputFields: [{ key: 'name', group: 'personal' }],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should handle empty inputFieldGroups correctly', () => {
      const definition = {
        ...baseDefinition,
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
              inputFields: [{ key: 'name' }, { key: 'email' }],
            },
          },
        },
        resources: {
          item: {
            key: 'item',
            noun: 'Item',
            list: {
              display: {
                label: 'List Items',
                description: 'List all items',
              },
              operation: {
                perform: '$func$2$f$',
                inputFields: [{ key: 'category' }],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });
  });
});
