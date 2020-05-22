const recipeOutputFields = async (z, bundle) => {
  const response = await z.request('https://example.com/api/v2/fields.json');

  // response.throwForStatus() if you're using core v9 or older

  // Should return an array like [{"key":"field_1","label":"Label for Custom Field"}]
  return response.data; // or response.json if you're on core v9 or older
};

const App = {
  // ...
  triggers: {
    new_recipe: {
      // ...
      operation: {
        perform: () => {},
        sample: {
          id: 1,
          title: 'Pancake',
          author: {
            id: 1,
            name: 'Amy',
          },
          ingredients: [
            {
              name: 'Egg',
              amount: 1,
            },
            {
              name: 'Milk',
              amount: 60,
              unit: 'g',
            },
            {
              name: 'Flour',
              amount: 30,
              unit: 'g',
            },
          ],
        },
        // an array of objects is the simplest way
        outputFields: [
          {
            key: 'id',
            label: 'Recipe ID',
            type: 'integer',
          },
          {
            key: 'title',
            label: 'Recipe Title',
            type: 'string',
          },
          {
            key: 'author__id',
            label: 'Author User ID',
            type: 'integer',
          },
          {
            key: 'author__name',
            label: 'Author Name',
            type: 'string',
          },
          {
            key: 'ingredients[]name',
            label: 'Ingredient Name',
            type: 'string',
          },
          {
            key: 'ingredients[]amount',
            label: 'Ingredient Amount',
            type: 'number',
          },
          {
            key: 'ingredients[]unit',
            label: 'Ingredient Unit',
            type: 'string',
          },
          recipeOutputFields, // provide a function inline - we'll merge the results!
        ],
      },
    },
  },
};
