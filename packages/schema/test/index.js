'use strict';

const should = require('should');
const schema = require('../schema');

const testUtils = require('./utils');

const appDefinition = require('../examples/definition.json');

const copy = (o) => JSON.parse(JSON.stringify(o));

const NUM_SCHEMAS = 60; // changes regularly as we expand

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

    it('should invalidate a badly named trigger', () => {
      const appCopy = copy(appDefinition);
      appCopy.triggers['3contact_by_tag'] = appCopy.triggers.contact_by_tag;
      delete appCopy.triggers.contact_by_tag;
      const results = schema.validateAppDefinition(appCopy);
      results.errors[0].stack.should.eql(
        'instance.triggers additionalProperty "3contact_by_tag" exists in instance when not allowed',
      );
      results.errors.length.should.eql(2); // additional property error + top-level key doesn't match trigger key
    });

    it('should invalidate a badly named create', () => {
      const appCopy = copy(appDefinition);
      appCopy.creates['3contact_by_tag'] = appCopy.creates.tag_create;
      delete appCopy.creates.tag_create;
      const results = schema.validateAppDefinition(appCopy);
      results.errors[0].stack.should.eql(
        'instance.creates additionalProperty "3contact_by_tag" exists in instance when not allowed',
      );
      results.errors.length.should.eql(2); // additional property error + top-level key doesn't match create key
    });

    it('should invalidate a create with a bad key', () => {
      const appCopy = copy(appDefinition);
      appCopy.creates.tag_create.key = 'tag:create';
      const results = schema.validateAppDefinition(appCopy);
      results.errors[0].stack.should.eql(
        'instance.creates.tag_create.key does not match pattern "^[a-zA-Z]+[a-zA-Z0-9_]*$"',
      );
      results.errors.length.should.eql(2); // invalid name and top-level key doesn't match create key
    });

    it('should run and pass functional constraints', function () {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        searches: {
          fooSearch: {
            key: 'fooSearch',
            noun: 'Foo',
            display: {
              label: 'Find Foo',
              description: 'Find a foo...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
            },
          },
        },
        creates: {
          fooCreate: {
            key: 'fooCreate',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
            },
          },
        },
        searchOrCreates: {
          fooSearchOrCreate: {
            key: 'fooSearch',
            display: {
              label: 'Find or Create a...',
              description: 'Something Something',
            },
            search: 'fooSearch',
            create: 'fooCreate',
          },
        },
      };
      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(0);
    });

    it('should run functional constraints with errors', function () {
      const definition = {
        version: '1.0.0',
        platformVersion: '1.0.0',
        searches: {
          fooSearch: {
            key: 'fooSearch',
            noun: 'Foo',
            display: {
              label: 'Find Foo',
              description: 'Find a foo...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
            },
          },
        },
        creates: {
          fooCreate: {
            key: 'fooCreate',
            noun: 'Foo',
            display: {
              label: 'Create Foo',
              description: 'Creates a...',
            },
            operation: {
              perform: '$func$2$f$',
              sample: { id: 1 },
            },
          },
        },
        searchOrCreates: {
          fooSearchOrCreate: {
            key: 'fooSearchOrCreate',
            display: {
              label: 'Find or Create a...',
              description: 'Something Something',
            },
            search: 'fooBad',
            create: 'fooBad',
          },
        },
      };
      const results = schema.validateAppDefinition(definition);
      results.errors.should.have.length(3);
      results.errors[0].stack.should.eql(
        'instance.searchOrCreates.fooSearchOrCreate.key must match a "key" from a search (options: fooSearch)',
      );
      results.errors[1].stack.should.eql(
        'instance.searchOrCreates.fooSearchOrCreate.search must match a "key" from a search (options: fooSearch)',
      );
      results.errors[2].stack.should.eql(
        'instance.searchOrCreates.fooSearchOrCreate.create must match a "key" from a create (options: fooCreate)',
      );
    });

    it('should validate inputFormat', () => {
      const appCopy = copy(appDefinition);
      appCopy.authentication = {
        type: 'custom',
        test: {
          url: 'https://example.com',
        },
        fields: [
          {
            key: 'subdomain',
            type: 'string',
            required: true,
            inputFormat: 'https://{{input}}.example.com',
          },
        ],
      };
      const results = schema.validateAppDefinition(appCopy);
      // this line ensures we're getting a ValidatorResult class, not just an object that looks like one
      should(results.valid).eql(true);
      results.errors.should.eql([]);
    });

    it('should invalidate illegal inputFormat', () => {
      const appCopy = copy(appDefinition);
      appCopy.authentication = {
        type: 'custom',
        test: {
          url: 'https://example.com',
        },
        fields: [
          {
            key: 'subdomain',
            type: 'string',
            required: true,
            inputFormat: 'https://{{input}.example.com',
          },
        ],
      };
      const results = schema.validateAppDefinition(appCopy);
      results.errors.length.should.eql(1);
      should(results.valid).eql(false);

      const error = results.errors[0];
      error.name.should.eql('pattern');
      error.instance.should.eql('https://{{input}.example.com');
    });

    it('should validate legacy properties', () => {
      const appCopy = copy(appDefinition);
      appCopy.legacy = {
        subscribeUrl: 'https://example.com',
        triggers: {
          contact: {
            url: 'https://example.com',
          },
        },
      };
      const results = schema.validateAppDefinition(appCopy);
      results.errors.should.eql([]);
    });

    it('should validate safe/unsafe auth fields', () => {
      const appCopy = copy(appDefinition);

      // Set up a "custom" auth that has two fields:
      //   - "username" which is safe
      //   - "password" which is not safe
      appCopy.authentication = {
        type: 'custom',
        test: {
          url: 'https://example.com',
        },
        fields: [
          {
            key: 'username',
            type: 'string',
            isSafe: true, // allowed
            required: true,
          },
          {
            key: 'password',
            type: 'string',
            isSafe: false, // password is not safe
            required: true,
          },
        ],
      };

      const results = schema.validateAppDefinition(appCopy);

      // Expect zero errors
      results.errors.should.have.length(0);
      should(results.valid).eql(true);
    });

    it('should invalidate a "safe" password field', () => {
      const appCopy = copy(appDefinition);

      // Same "custom" auth but now marking "password" as isSafe=true
      appCopy.authentication = {
        type: 'custom',
        test: {
          url: 'https://example.com',
        },
        fields: [
          {
            key: 'password',
            type: 'string',
            isSafe: true, // invalid: password cannot be safe
            required: true,
          },
        ],
      };

      const results = schema.validateAppDefinition(appCopy);

      // Expect at least one error because "password" can't have isSafe = true
      console.log(results);
      results.errors.should.have.length(1);
      should(results.valid).eql(false);

      const [error] = results.errors;
      // Check that the error specifically complains about a "not" rule or something similar
      error.name.should.equal('sensitive');
      error.message.should.equal(
        'Cannot set isSafe=true for the sensitive key "password".',
      );
    });
  });

  describe('export', () => {
    it('should export the full schema', () => {
      const exportedSchema = schema.exportSchema();
      Object.keys(exportedSchema.schemas).length.should.eql(NUM_SCHEMAS);
    });
  });
});

describe('auto test', () => {
  const _exportedSchema = schema.exportSchema();
  Object.keys(_exportedSchema.schemas).map((id) =>
    testUtils.testInlineSchemaExamples(id),
  );
});
