module.exports = {
  key: 'movie',

  noun: 'Movie',
  display: {
    label: 'New Movie',
    description: 'Trigger when a new movie is added.'
  },

  operation: {
    perform: {
      url: '{{process.env.BASE_URL}}/movies'
    }
  }
};
