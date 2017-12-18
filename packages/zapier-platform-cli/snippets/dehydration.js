const getExtraDataFunction = (z, bundle) => {
  const url = `http://example.com/movies/${bundle.inputData.id}.json`;
  return z.request(url).then(res => z.JSON.parse(res.content));
};

const movieList = (z, bundle) => {
  return z
    .request('http://example.com/movies.json')
    .then(res => z.JSON.parse(res.content))
    .then(results => {
      return results.map(result => {
        // so maybe /movies.json is thin content but
        // /movies/:id.json has more details we want...
        result.moreData = z.dehydrate(getExtraDataFunction, {
          id: result.id
        });
        return result;
      });
    });
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // don't forget to register hydrators here!
  // it can be imported from any module
  hydrators: {
    getExtraData: getExtraDataFunction
  },

  triggers: {
    new_movie: {
      noun: 'Movie',
      display: {
        label: 'New Movie',
        description: 'Triggers when a new Movie is added.'
      },
      operation: {
        perform: movieList
      }
    }
  }
};

module.exports = App;
