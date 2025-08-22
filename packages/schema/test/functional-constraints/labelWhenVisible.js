const should = require('should');
const schema = require('../../schema');

describe('labelWhenVisible', () => {
  it('should not error when label is gone and action is hidden', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          type: 'create',
          noun: 'Foo',
          display: {
            hidden: true,
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error when label is missing and action is visible ', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          type: 'create',
          noun: 'Foo',
          display: {
            hidden: false,
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    const err = results.errors[0];
    should(err.codeLinks[0].includes('BasicDisplaySchema')).be.true();
    err.property.should.eql('instance.creates.foo.display');
  });

  it('should error when label is alone when create is visible ', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          type: 'create',
          noun: 'Foo',
          display: {
            label: 'nea',
          },
          operation: {
            perform: '$func$2$f$',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
  });
});
