module.exports = {
  key: 'recipe',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Recipe',
  display: {
    label: 'New Recipe',
    description: 'Trigger when a new recipe is added.'
  },

  // `operation` is where we make the call to your API
  operation: {
    perform: {
      url: '{{process.env.BASE_URL}/recipes'
    }
  }
};
