'use strict';

require('should');
const schema = require('../schema');

describe('alignedInputFieldDefaultType', () => {
  it('should error when the default value is not of the same type set for the inputField', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',
      creates: {
        foo: {
          key: 'foo',
          noun: 'Foo',
          display: {
            label: 'Create Foo',
            description: 'Creates a...',
          },
          operation: {
            perform: '$func$2$f$',
            sample: { id: 1 },
            inputFields: [
              { key: 'name', type: 'string', default: 'John Doe' },
              {
                key: 'address',
                type: 'text',
                default:
                  'Lorem Ipsum Street, Lorem Ipsum Area, Lorem Ipsum State, Lorem Ipsum Country.',
              },
              { key: 'location', type: 'string', default: 20 },
              { key: 'age', type: 'integer', default: 30 },
              { key: 'height', type: 'number', default: 1.71 },
              { key: 'isAdult', type: 'boolean', default: true },
              {
                key: 'favoriteCode',
                type: 'code',
                default: '<p>Hello World</p>',
              },
              { key: 'dob', type: 'datetime', default: '1994-01-01' },
              {
                key: 'picture',
                type: 'file',
                default: 'https://my.picture.com/1.png',
              },
              {
                key: 'favoritePassword',
                type: 'password',
                default: 'check your palm',
              },
              { key: 'slogan', type: 'copy', default: 'copycat' },
            ],
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);

    results.errors[0].message.should.eql(
      'default value 20 must be of the same type "string" set for the inputField "location"',
    );
  });
});
