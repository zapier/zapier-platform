'use strict';

require('should');
const schema = require('../../schema');

describe('searchOrCreateKeys', () => {
  it('should not error on properly defined searchesOrCreates', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',

      creates: {
        add_product: {
          key: 'add_product',
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

      searchOrCreates: {
        findOrCreateProduct: {
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

  it('should error if searchOrCreate.key does not match a searches.key', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',

      creates: {
        add_product: {
          key: 'add_product',
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

      searchOrCreates: {
        findOrCreateProduct: {
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
      'instance.searchOrCreates.findOrCreateProduct.key must match a "key" from a search (options: find_product)'
    );
  });

  it('should error on update key not matching an existing create key', () => {
    const definition = {
      version: '1.0.0',
      platformVersion: '1.0.0',

      creates: {
        add_product: {
          key: 'add_product',
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
      },

      searches: {
        find_product: {
          key: 'find_product',
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

      searchOrCreates: {
        findOrCreateProduct: {
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
      'instance.searchOrCreates.findOrCreateProduct.update must match a "key" from a create (options: add_product)'
    );
  });
});
