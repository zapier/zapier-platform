const baseURL = 'http://57b20fb546b57d1100a3c405.mockapi.io/api';

const getRecipe = (z, bundle) => {
  const promise = z.request({
    url: `${baseURL}/recipes/${bundle.inputData.id}`,
  });

  return promise.then((response) => JSON.parse(response.content));
};

const listRecipes = (z, bundle) => {
  const promise = z.request({
    url: `${baseURL}/recipes`,
    params: {
      style: bundle.inputData.style
    }
  });

  return promise.then((response) => JSON.parse(response.content));
};

const createRecipe = (z, bundle) => {
  const promise = z.request({
    url: `${baseURL}/recipes`,
    method: 'POST',
    body: JSON.stringify({
      name: bundle.inputData.name,
      directions: bundle.inputData.directions,
      authorId: bundle.inputData.authorId,
    }),
    headers: {
      'content-type': 'application/json'
    }
  });

  return promise.then((response) => JSON.parse(response.content));
};

// This file exports a Recipe resource. The definition below contains all of the keys available,
// and implements the list and create methods.
module.exports = {
  key: 'recipe',
  noun: 'Recipe',
  // The get method is used by Zapier to fetch a complete representation of a record. This is helpful when the HTTP
  // response from a create call only return an ID, or a search that only returns a minimuml representation of the
  // record. Zapier will follow these up with the get() to retrieve the entire object.
  get: {
    display: {
      label: 'Get Recipe',
      description: 'Gets a recipe.'
    },
    operation: {
      inputFields: [
        {key: 'id', required: true}
      ],
      perform: getRecipe
    }
  },
  // The list method on this resource becomes a Trigger on the app. Zapier will use polling to watch for new records
  list: {
    display: {
      label: 'New Recipe',
      description: 'Trigger when a new recipe is added.'
    },
    operation: {
      inputFields: [
        {key: 'style', type: 'string'}
      ],
      perform: listRecipes
    }
  },
  // If your app supports webhooks, you can define a hook method instead of a list method.
  // Zapier will turn this into a webhook Trigger on the app.
  // hook: {
  //
  // },

  // The create method on this resource becomes a Write on this app
  create: {
    display: {
      label: 'Create Recipe',
      description: 'Creates a new recipe.'
    },
    operation: {
      inputFields: [
        {key: 'name', required: true, type: 'string'},
        {key: 'directions', required: true, type: 'text'},
        {key: 'authorId', required: true, type: 'integer'}
      ],
      perform: createRecipe
    }
  },
  // You could define a search method, which becomes a Search on the app
  // search: {
    //...
  // },
  // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
  // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
  // returned records, and have dummy values that we can show to any user.
  sample: {
    id: 1,
    createdAt: 1472069465,
    name: 'Best Spagetti Ever',
    authorId: 1,
    directions: '1. Boil Noodles\n2.Serve with sauce',
    style: 'italian'
  }
  // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
  // field definitions. The result will be used to augment the sample.
  // outputFields: () => { return []; }
};
