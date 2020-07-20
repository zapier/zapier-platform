const getMovieDetails = async (z, bundle) => {
  const url = `https://example.com/movies/${bundle.inputData.id}.json`;
  const response = await z.request(url);

  // reponse.throwForStatus() if you're using core v9 or older

  return response.data; // or response.json if you're using core v9 or older
};

const movieList = async (z, bundle) => {
  const response = await z.request('https://example.com/movies.json');

  // response.throwForStatus() if you're using core v9 or older

  return response.data.map((movie) => {
    // so maybe /movies.json is thin content but /movies/:id.json has more
    // details we want...
    movie.details = z.dehydrate(getMovieDetails, { id: movie.id });
    return movie;
  });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // don't forget to register hydrators here!
  // it can be imported from any module
  hydrators: {
    getMovieDetails: getMovieDetails,
  },

  triggers: {
    new_movie: {
      noun: 'Movie',
      display: {
        label: 'New Movie',
        description: 'Triggers when a new Movie is added.',
      },
      operation: {
        perform: movieList,
      },
    },
  },
};

module.exports = App;
