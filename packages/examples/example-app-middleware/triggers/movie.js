module.exports = {
  key: 'movie',

  noun: 'Movie',
  display: {
    label: 'New Movie',
    description: 'Trigger when a new movie is added.'
  },

  operation: {
    perform: {
      url: 'http://57b20fb546b57d1100a3c405.mockapi.io/api/movies'
    }
  }
};
