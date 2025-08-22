'use strict';

require('should');
const schema = require('../../schema');

describe('searchAndCreatesAlias', () => {
  it('should not error if schema contains both searchOrCreates and searchAndCreates keys', () => {
    const definition = {
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
            inputFields: [{ key: 'product_title' }],
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { id: 1, title: 'Nike Air' },
          },
        },
      },

      // Can have both searchOrCreates AND searchAndCreates defined
      searchOrCreates: {
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
        },
      },
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

  it('should not error if schema contains only searchOrCreates key', () => {
    const definition = {
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
            inputFields: [{ key: 'product_title' }],
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { id: 1, title: 'Nike Air' },
          },
        },
      },

      searchOrCreates: {
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

  it('should not error if schema contains only searchAndCreates key', () => {
    const definition = {
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
            inputFields: [{ key: 'product_title' }],
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { id: 1, title: 'Nike Air' },
          },
        },
      },

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
});
