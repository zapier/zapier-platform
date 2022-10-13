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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

  it('should not error on properly defined searchesOrCreates with update key', () => {
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
            inputFields: [{ key: 'product_title' }],
            outputFields: [{ key: 'product_title', type: 'string' }],
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

  it('should error if searchOrCreate.key does not match a searches key', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

  it('should error on searchesOrCreate.create key not matching an existing creates key', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

          create: 'create_product', // No such key in creates
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.create must match a "key" from a create (options: add_product)'
    );
  });

  it('should error if searchesOrCreate.update is defined and does not match a creates key', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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
      'instance.searchOrCreates.findOrCreateProduct.update must match a "key" from a create (options: add_product,update_product)'
    );
  });

  it('should error if searchesOrCreate.updateInputFromSearchOutput is defined and but searchesOrCreate.update is not defined', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput requires searchOrCreates.findOrCreateProduct.update to be defined'
    );
  });

  it('should error if searchesOrCreate.searchUniqueInputToOutputConstraint is defined and but searchesOrCreate.update is not defined', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

          searchUniqueInputToOutputConstraint: {
            product_title: 'title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint requires searchOrCreates.findOrCreateProduct.update to be defined'
    );
  });

  it('should error if the searchOrCreate.updateInputFromSearchOutput object has a key not in creates.operations.inputFields', () => {
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
            inputFields: [{ key: 'product_identity', type: 'string' }], // Mismatch key (should be product_id)
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
            outputFields: [{ key: 'product_title', type: 'string' }],
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

          update: 'update_product',

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput must match a "key" from a creates.update_product.operation.inputFields (options: product_identity)'
    );
  });

  it('should error if the searchOrCreate.updateInputFromSearchOutput object has a value not in searches.operation.outputFields or searches.operation.sample, when these are defined', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { identity: 1, title: 'Nike Air' }, // Mismatched key ('identity' should be 'id')
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

          update: 'update_product',

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput must match a "key" from searches.find_product.operation.(outputFields|sample) (options: product_title,identity,title)'
    );
  });

  it('should not error if the searchOrCreate.updateInputFromSearchOutput object has a value but searches.operation.outputFields and searches.operation.sample are not defined', () => {
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
            // Does not contain outputFields or sample keys
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

          update: 'update_product',

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a key but searches.operations.inputFields is not defined', () => {
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
            inputFields: [{ key: 'product_identity', type: 'string' }],
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
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { id: 1, title: 'Nike Air' },
            // Does not contain any inputFields
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

          update: 'update_product',

          searchUniqueInputToOutputConstraint: {
            product_title: 'title',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint must match a "key" from a searches.find_product.operation.inputFields (no "key" found in inputFields)'
    );
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a key not in searches.operations.inputFields', () => {
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
            inputFields: [{ key: 'product_identity', type: 'string' }],
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
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { id: 1, title: 'Nike Air' },
            inputFields: [{ key: 'product_title', type: 'string' }],
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

          update: 'update_product',

          searchUniqueInputToOutputConstraint: {
            title_of_product: 'title', // title_of_product does not exist in searches.operation.(outputFields.key|sample keys)
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.searchUniqueInputToOutputConstraint must match a "key" from a searches.find_product.operation.inputFields (options: product_title)'
    );
  });

  it('should error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a value not in searches.operation.outputFields or searches.operation.sample, when these are defined', () => {
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
            outputFields: [{ key: 'product_title', type: 'string' }],
            sample: { identity: 1, title: 'Nike Air' }, // Mismatched key ('identity' should be 'id')
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

          update: 'update_product',

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(1);
    results.errors[0].stack.should.eql(
      'instance.searchOrCreates.findOrCreateProduct.updateInputFromSearchOutput must match a "key" from searches.find_product.operation.(outputFields|sample) (options: product_title,identity,title)'
    );
  });

  it('should not error if the searchOrCreate.searchUniqueInputToOutputConstraint object has a value but searches.operation.outputFields and searches.operation.sample are not defined', () => {
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
            // Does not contain outputFields or sample keys
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

          update: 'update_product',

          updateInputFromSearchOutput: {
            product_id: 'id',
          },
        },
      },
    };

    const results = schema.validateAppDefinition(definition);
    results.errors.should.have.length(0);
  });
});
