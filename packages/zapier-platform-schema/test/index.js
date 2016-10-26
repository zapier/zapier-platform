'use strict';

require('should');
const schema = require('../schema');

const testUtils = require('./utils');

const appDefinition = require('../examples/definition.json');

const copy = (o) => JSON.parse(JSON.stringify(o));

describe('app', () => {

  describe('validation', () => {
    it('should be a valid app', () => {
      const results = schema.validateAppDefinition(appDefinition);
      results.errors.should.eql([]);
    });

    it('should invalidate deep errors', () => {
      const appCopy = copy(appDefinition);
      delete appCopy.version;
      delete appCopy.triggers.contact_by_tag.noun;
      delete appCopy.triggers.contact_by_tag.display.label;
      appCopy.triggers.contact_by_tag.operation.inputFields[0].type = 'loltype';
      const results = schema.validateAppDefinition(appCopy);
      results.errors.length.should.eql(4);
    });

    it('should invalidate a bad named trigger', () => {
      const appCopy = copy(appDefinition);
      appCopy.triggers['3contact_by_tag'] = appCopy.triggers.contact_by_tag;
      delete appCopy.triggers.contact_by_tag;
      const results = schema.validateAppDefinition(appCopy);
      results.errors.length.should.eql(1);
    });

    it('should run functional constraints', function() {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        searches: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Find Foo',
              description: 'Find a foo...',
            },
            operation: {
              perform: '$func$2$f$'
            }
          }
        },
        creates: {
          foo: {
            key: 'foo',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$'
            }
          }
        },
        searchOrCreates: {
          bar: {
            key: 'bar',
            display: {
              label: 'Find or Create a...',
              description: 'Something Something'
            },
            search: 'foo',
            create: 'foo',
          }
        }
      };
      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(1);
      results.errors[0].stack.should.eql('instance.searchOrCreates.bar.key must match a "key" from a search (options: foo)');
    });
  });

  describe('export', () => {
    it('should export the full schema', () => {
      const exportedSchema = schema.exportSchema();
      Object.keys(exportedSchema.schemas).length.should.eql(40); // changes regularly as we expand
    });
  });

});

describe('auto test', () => {
  const _exportedSchema = schema.exportSchema();
  Object.keys(_exportedSchema.schemas).map((id) => {
    testUtils.testInlineSchemaExamples(id);
  });
});
