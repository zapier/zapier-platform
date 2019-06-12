const recipeOutputFields = (z, bundle) => {
  const response = z.request('http://example.com/api/v2/fields.json');
  // json is like [{"key":"field_1","label":"Label for Custom Field"}]
  return response.then(res => z.JSON.parse(res.content));
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
          title: 'Pancake',
          author: {
            id: 1,
            name: 'Amy'
          },
          ingredients: [
            {
              name: 'Egg',
              amount: 1
            },
            {
              name: 'Milk',
              amount: 60,
              unit: 'g'
            },
            {
              name: 'Flour',
              amount: 30,
              unit: 'g'
            }
          ]
        },
        // an array of objects is the simplest way
        outputFields: [
          {
            key: 'id',
            label: 'Recipe ID',
            type: 'integer'
          },
          {
            key: 'title',
            label: 'Recipe Title',
            type: 'string'
          },
          {
            key: 'author__id',
            label: 'Author User ID',
            type: 'integer'
          },
          {
            key: 'author__name',
            label: 'Author Name',
            type: 'string'
          },
          {
            key: 'ingredients[]name',
            label: 'Ingredient Name',
            type: 'string'
          },
          {
            key: 'ingredients[]amount',
            label: 'Ingredient Amount',
            type: 'number'
          },
          {
            key: 'ingredients[]unit',
            label: 'Ingredient Unit',
            type: 'string'
          },
          recipeOutputFields // provide a function inline - we'll merge the results!
        ]
      }
    }
  }
};
