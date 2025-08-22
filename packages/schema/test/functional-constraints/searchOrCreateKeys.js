'use strict';

require('should');
const _ = require('lodash');

const schema = require('../../schema');

describe('searchOrCreateKeys', () => {
  const baseDefinition = {
    version: '1.0.0',
    platformVersion: '1.0.0',

    creates: {
      add_product: {
        key: 'add_product',
        type: 'create',
        noun: 'Product',
        display: {
          label: 'Create Product',
          description: 'Creates a new Product',
        },
        operation: {
          perform: '$func$0$f$',
          sample: { id: 1, title: 'Air Jordan' },
        },
      },

      update_product: {
        key: 'update_product',
        type: 'create',
        noun: 'Product',
        display: {
          label: 'Update Product',
          description: 'Updates an existing Product',
        },
        operation: {
          perform: '$func$2$f$',
          sample: { id: 1, title: 'Nike Dunk High Retro' },
          inputFields: [{ key: 'product_id', type: 'string' }],
        },
      },
    },

    searches: {
      find_product: {
        key: 'find_product',
        type: 'search',
        noun: 'Product',
        display: {
          label: 'Search Product',
          description: 'Searches for an existing Product',
        },
        operation: {
          perform: '$func$1$f$',
          inputFields: [{ key: 'product_title', type: 'string' }],
          sample: { id: 1, title: 'Nike Air' },
        },
      },
    },
  };

  it('should not error on properly defined searchesOrCreates', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should not error on properly defined searchesOrCreates with update key', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          updateInputFromSearchOutput: {
            product_id: 'id',
          },
          searchUniqueInputToOutputConstraint: {
            product_title: 'title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error if searchesAndCreates contains an unknown key', () => {
    const definition = {
      ...baseDefinition,
      searchAndCreates: {
        findOrCreateProduct: {
          key: 'find_product',
          type: 'searchOrCreate',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          test: 'wrong', // Unknown key
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchAndCreates.findOrCreateProduct additionalProperty "test" exists in instance when not allowed',
    );
  });

  it('should error if searchOrCreate.key does not match a search key', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          key: 'search_product', // Different key from any searches.key
          type: 'searchOrCreate',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.key must match a "key" from a search (options: find_product)',
    );
  });

  it('should error if searchAndCreate.key does not match a search key', () => {
    const definition = {
      ...baseDefinition,
      searchAndCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'search_product', // Different key from any searches.key
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchAndCreates.findOrCreateProduct.key must match a "key" from a search (options: find_product)',
    );
  });

  it('should error if searchesOrCreate.create key not matching an existing create key', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'create_product', // No such key in creates
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.create must match a "key" from a create (options: add_product,update_product)',
    );
  });

  it('should error if searchesAndCreate.create key not matching an existing create key', () => {
    const definition = {
      ...baseDefinition,
      searchAndCreates: {
        findOrCreateProduct: {
          key: 'find_product',
          type: 'searchOrCreate',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'create_product', // No such key in creates
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchAndCreates.findOrCreateProduct.create must match a "key" from a create (options: add_product,update_product)',
    );
  });

  it('should error if searchesOrCreate.update is defined and does not match a create key', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'create_product', // No such key in creates
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.update must match a "key" from a create (options: add_product,update_product)',
    );
  });

  it('should error if searchesOrCreate.updateInputFromSearchOutput is defined and but searchesOrCreate.update is not defined', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput requires searchOrCreates.findOrCreateProduct.update to be defined',
    );
  });

  it('should error if searchesOrCreate.searchUniqueInputToOutputConstraint is defined and but searchesOrCreate.update is not defined', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          searchUniqueInputToOutputConstraint: {
            product_title: 'title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint requires searchOrCreates.findOrCreateProduct.update to be defined',
    );
  });

  it('should error if the searchOrCreate.updateInputFromSearchOutput object has a key not in creates.operations.inputFields', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          updateInputFromSearchOutput: {
            productId: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput object key must match a "key" from a creates.update_product.operation.inputFields (options: product_id)',
    );
  });

  it('should error if the searchOrCreate.updateInputFromSearchOutput object has a value not in searches.operation.outputFields or searches.operation.sample, when these are defined', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          updateInputFromSearchOutput: {
            product_id: 'product_id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput object value must match a "key" from searches.find_product.operation.(outputFields|sample) (options: id,title)',
    );
  });

  it('should not error if the searchOrCreate.updateInputFromSearchOutput object has a value but searches.operation.outputFields and searches.operation.sample are not defined', () => {
    const definition = _.cloneDeep(baseDefinition);
    definition.searchOrCreates = {
      findOrCreateProduct: {
        type: 'searchOrCreate',
        key: 'find_product',
        display: {
          label: 'Search or Create',
          description:
            'Tries to fetch a product, creates one if it does not find at least one.',
        },
        search: 'find_product',
        create: 'add_product',
        update: 'update_product',
        updateInputFromSearchOutput: {
          product_id: 'id',
        },
      },
    };
    delete definition.searches.find_product.operation.sample;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a key but searches.operations.inputFields is not defined', () => {
    const definition = _.cloneDeep(baseDefinition);
    definition.searchOrCreates = {
      findOrCreateProduct: {
        type: 'searchOrCreate',
        key: 'find_product',
        display: {
          label: 'Search or Create',
          description:
            'Tries to fetch a product, creates one if it does not find at least one.',
        },
        search: 'find_product',
        create: 'add_product',
        update: 'update_product',
        searchUniqueInputToOutputConstraint: {
          product_title: 'title',
        },
      },
    };
    definition.searches.find_product.operation.inputFields = [];

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint object key must match a "key" from a searches.find_product.operation.inputFields (no "key" found in inputFields)',
    );
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a key not in searches.operations.inputFields', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          searchUniqueInputToOutputConstraint: {
            // title_of_product does not exist in searches.operation.(outputFields.key|sample keys)
            title_of_product: 'title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint object key must match a "key" from a searches.find_product.operation.inputFields (options: product_title)',
    );
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a value not in searches.operation.outputFields or searches.operation.sample, when these are defined', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        findOrCreateProduct: {
          type: 'searchOrCreate',
          key: 'find_product',
          display: {
            label: 'Search or Create',
            description:
              'Tries to fetch a product, creates one if it does not find at least one.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          searchUniqueInputToOutputConstraint: {
            product_title: 'product_title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint object value must match a "key" from searches.find_product.operation.(outputFields|sample) (options: id,title)',
    );
  });

  it('should not error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a value but searches.operation.outputFields and searches.operation.sample are not defined', () => {
    const definition = _.cloneDeep(baseDefinition);
    definition.searchOrCreates = {
      findOrCreateProduct: {
        type: 'searchOrCreate',
        key: 'find_product',
        display: {
          label: 'Search or Create',
          description:
            'Tries to fetch a product, creates one if it does not find at least one.',
        },
        search: 'find_product',
        create: 'add_product',
        update: 'update_product',
        searchUniqueInputToOutputConstraint: {
          product_title: 'product_title',
        },
      },
    };
    delete definition.searches.find_product.operation.sample;

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should only give type errors if searchOrCreate.updateInputFromSearchOutput and searchOrCreate.searchUniqueInputToOutputConstraint are not objects', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        find_product: {
          key: 'find_product',
          type: 'searchOrCreate',
          display: {
            label: 'Find, Create, or Update Product',
            description: 'Finds, creates, or updates a product.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          updateInputFromSearchOutput: 'a_string',
          searchUniqueInputToOutputConstraint: ['title'],
        },
      },
    };

    const results = schema.validateAppDefinition(definition);

    // If updateInputFromSearchOutput or searchUniqueInputToOutputConstraint has
    // the wrong type, we don't want to validate its content.
    results.errors.should.have.length(2);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.find_product.updateInputFromSearchOutput is not of a type(s) object',
    );
    results.errors[1].stack.should.eql(
      'instance.searchOrCreates.find_product.searchUniqueInputToOutputConstraint is not of a type(s) object',
    );
  });

  it('should skip searchUniqueInputToOutputConstraint value check if it is nested', () => {
    const definition = {
      ...baseDefinition,
      searchOrCreates: {
        find_product: {
          key: 'find_product',
          type: 'searchOrCreate',
          display: {
            label: 'Find, Create, or Update Product',
            description: 'Finds, creates, or updates a product.',
          },
          search: 'find_product',
          create: 'add_product',
          update: 'update_product',
          searchUniqueInputToOutputConstraint: {
            product_title: {
              value_from_need: 'lookup_value',
            },
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
