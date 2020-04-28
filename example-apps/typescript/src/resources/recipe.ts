import { ZObject, Bundle } from 'zapier-platform-core';

const _sharedBaseUrl = 'https://auth-json-server.zapier-staging.com';

// you can optionally add add the shape of the inputData in bundle, which will pass that
//   info down into the function and tests
const getRecipe = async (z: ZObject, bundle: Bundle<{ id: string }>) => {
  const response = await z.request({
    url: `${_sharedBaseUrl}/recipes/${bundle.inputData.id}`
  });
  return response.json;
};

const listRecipes = async (z: ZObject, bundle: Bundle<{ style?: string }>) => {
  const response = await z.request({
    url: _sharedBaseUrl + '/recipes',
    params: {
      style: bundle.inputData.style
    }
  });
  return response.json;
};

const createRecipe = async (
  z: ZObject,
  bundle: Bundle<{
    name: string;
    directions: string;
    authorId: number;
    style?: string;
  }>
) => {
  const response = await z.request({
    url: _sharedBaseUrl + '/recipes',
    method: 'POST',
    body: {
      name: bundle.inputData.name,
      directions: bundle.inputData.directions,
      authorId: bundle.inputData.authorId
    },
    headers: {
      'content-type': 'application/json'
    }
  });
  return response.json;
};

const searchRecipe = async (z: ZObject, bundle: Bundle) => {
  const response = await z.request({
    url: _sharedBaseUrl + '/recipes',
    params: {
      nameSearch: bundle.inputData.name
    }
  });
  const matchingRecipes = response.json as {}[];

  // Only return the first matching recipe
  if (matchingRecipes && matchingRecipes.length) {
    return matchingRecipes[0];
  }

  return [];
};

const sample = {
  id: 1,
  createdAt: 1472069465,
  name: 'Best Spagetti Ever',
  authorId: 1,
  directions: '1. Boil Noodles\n2.Serve with sauce',
  style: 'italian'
};

// This file exports a Recipe resource. The definition below contains all of the keys available,
// and implements the list and create methods.
const Recipe = {
  key: 'recipe',
  noun: 'Recipe',
  // The get method is used by Zapier to fetch a complete representation of a record. This is helpful when the HTTP
  // response from a create call only return an ID, or a search that only returns a minimuml representation of the
  // record. Zapier will follow these up with the get() to retrieve the entire object.

  // You can delete this property if all your calls return the full object
  get: {
    display: {
      label: 'Get Recipe',
      description: 'Gets a recipe.'
    },
    operation: {
      inputFields: [{ key: 'id', required: true }],
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
        {
          key: 'style',
          type: 'string',
          helpText: 'Explain what style of cuisine this is.'
        }
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
        { key: 'name', required: true, type: 'string' },
        {
          key: 'directions',
          required: true,
          type: 'text',
          helpText: 'Explain how should one make the recipe, step by step.'
        },
        {
          key: 'authorId',
          required: true,
          type: 'integer',
          label: 'Author ID'
        },
        {
          key: 'style',
          required: false,
          type: 'string',
          helpText: 'Explain what style of cuisine this is.'
        }
      ],
      perform: createRecipe
    }
  },
  // The search method on this resource becomes a Search on this app
  search: {
    display: {
      label: 'Find Recipe',
      description: 'Finds an existing recipe by name.'
    },
    operation: {
      inputFields: [{ key: 'name', required: true, type: 'string' }],
      perform: searchRecipe
    }
  },

  // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
  // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
  // returned records, and have obviously dummy values that we can show to any user.
  sample,

  // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
  // field definitions. The result will be used to augment the sample.
  // outputFields: () => { return []; }
  // Alternatively, a static field definition should be provided, to specify labels for the fields
  outputFields: [
    { key: 'id', label: 'ID' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'name', label: 'Name' },
    { key: 'directions', label: 'Directions' },
    { key: 'authorId', label: 'Author ID' },
    { key: 'style', label: 'Style' }
  ]
};

export default Recipe;
