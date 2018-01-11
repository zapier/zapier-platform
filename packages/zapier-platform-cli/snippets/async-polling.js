module.exports = {
  key: 'paging',
  noun: 'Paging',

  display: {
    label: 'Get Paging',
    description: 'Triggers on a new paging.'
  },

  operation: {
    inputFields: [],
    perform: async (z, bundle) => {
      let response = await z.request({
        url: 'https://jsonplaceholder.typicode.com/posts',
        params: {
          _start: 0,
          _limit: 3
        }
      });

      let results = response.json;

      // conditionally make a second request
      if (results[0].id < 5) {
        response = await z.request({
          url: 'https://jsonplaceholder.typicode.com/posts',
          params: {
            _start: 3,
            _limit: 3
          }
        });

        results = results.concat(response.json);
      }

      return results;
    }
  }
};
