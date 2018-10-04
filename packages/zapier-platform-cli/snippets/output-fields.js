const recipeOutputFields = (z, bundle) => {
  const response = z.request('http://example.com/api/v2/fields.json');
  // json is like [{"key":"field_1","label":"Label for Custom Field"}]
  return response.then(res => res.json);
};

const App = {
  //...
  triggers: {
    new_recipe: {
      //...
      operation: {
        perform: () => {},
        sample: {
          id: 1,
          nested_parent: {
            key: 'Nested Field'
          },
          children_parent: [
            {
              key: 'Children Field'
            }
          ]
        },
        // an array of objects is the simplest way
        outputFields: [
          {
            key: 'id',
            label: 'Label for Simple Field'
          },
          {
            key: 'nested_parent__key',
            label: 'Label for Nested Field',
            important: true
          },
          {
            key: 'children_parent[]key',
            label: 'Label for Children Field',
            important: true
          },
          recipeOutputFields // provide a function inline - we'll merge the results!
        ]
      }
    }
  }
};
