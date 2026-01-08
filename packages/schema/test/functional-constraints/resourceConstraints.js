'use strict';

require('should');
const schema = require('../../schema');

describe('resourceConstraints', () => {
  const baseDefinition = {
    version: '1.0.0',
    platformVersion: '17.2.0',
  };

  describe('Valid Resource References', () => {
    it('should pass when resource reference exists in resources', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'spreadsheet_id',
                  resource: 'spreadsheet',
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should pass when resource reference uses dot notation for valid resource', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'spreadsheet_url',
                  resource: 'spreadsheet.url', // Dot notation for field reference
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should skip validation when no resources are defined', () => {
      const definition = {
        ...baseDefinition,
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'spreadsheet_id',
                  resource: 'spreadsheet', // No resources defined, skip validation
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should pass when input field has no resource property', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'row_data',
                  // No resource property
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });
  });

  describe('Invalid Resource References', () => {
    it('should error when resource reference does not exist', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'worksheet_id',
                  resource: 'worksheet', // Does not exist
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('invalidResourceReference');
      results.errors[0].message.should.match(
        /Resource "worksheet" is not defined in resources/,
      );
      results.errors[0].property.should.equal(
        'instance.creates.add_row.operation.inputFields[0].resource',
      );
    });

    it('should error when dot notation resource key does not exist', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_row: {
            key: 'add_row',
            noun: 'Row',
            display: {
              label: 'Add Row',
              description: 'Add a row to a spreadsheet',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'worksheet_url',
                  resource: 'worksheet.url', // worksheet does not exist
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('invalidResourceReference');
      results.errors[0].message.should.match(
        /Resource "worksheet" is not defined in resources/,
      );
    });
  });

  describe('Children Fields Validation', () => {
    it('should validate resource references in children fields', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        creates: {
          add_rows: {
            key: 'add_rows',
            noun: 'Rows',
            display: {
              label: 'Add Rows',
              description: 'Add multiple rows',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'rows',
                  children: [
                    {
                      key: 'worksheet_id',
                      resource: 'worksheet', // Does not exist
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
      results.errors[0].name.should.equal('invalidResourceReference');
      results.errors[0].property.should.equal(
        'instance.creates.add_rows.operation.inputFields[0].children[0].resource',
      );
    });
  });

  describe('Resource Methods Validation', () => {
    it('should validate resource references in resource method inputFields', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
          worksheet: {
            key: 'worksheet',
            noun: 'Worksheet',
            list: {
              display: {
                label: 'List Worksheets',
                description: 'List worksheets in a spreadsheet',
              },
              operation: {
                perform: '$func$2$f$',
                inputFields: [
                  {
                    key: 'folder_id',
                    resource: 'folder', // Does not exist
                  },
                ],
              },
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].name.should.equal('invalidResourceReference');
      results.errors[0].message.should.match(
        /Resource "folder" is not defined in resources/,
      );
      results.errors[0].property.should.equal(
        'instance.resources.worksheet.list.operation.inputFields[0].resource',
      );
    });
  });

  describe('Multiple Action Types', () => {
    it('should validate resource references in triggers', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        triggers: {
          new_row: {
            key: 'new_row',
            noun: 'Row',
            display: {
              label: 'New Row',
              description: 'Triggers on new row',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'worksheet_id',
                  resource: 'worksheet', // Does not exist
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].property.should.equal(
        'instance.triggers.new_row.operation.inputFields[0].resource',
      );
    });

    it('should validate resource references in searches', () => {
      const definition = {
        ...baseDefinition,
        resources: {
          spreadsheet: {
            key: 'spreadsheet',
            noun: 'Spreadsheet',
            list: {
              display: {
                label: 'List Spreadsheets',
                description: 'List all spreadsheets',
              },
              operation: {
                perform: '$func$2$f$',
              },
            },
          },
        },
        searches: {
          find_row: {
            key: 'find_row',
            noun: 'Row',
            display: {
              label: 'Find Row',
              description: 'Find a row',
            },
            operation: {
              perform: '$func$2$f$',
              inputFields: [
                {
                  key: 'worksheet_id',
                  resource: 'worksheet', // Does not exist
                },
              ],
            },
          },
        },
      };

      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].property.should.equal(
        'instance.searches.find_row.operation.inputFields[0].resource',
      );
    });
  });
});
