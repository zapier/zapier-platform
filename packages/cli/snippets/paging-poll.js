// some async call
const makeCall = (z, start, limit) => {
  return z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      _start: start,
      _limit: limit
    }
  });
};

// triggers on paging with a certain tag
const performPaging = (z, bundle) => {
  const limit = 3;
  let start = 0;

  // array of promises
  let promises = [];

  let i = 0;
  while (i < 5) {
    promises.push(makeCall(z, start, limit));
    start += limit;
    i += 1;
  }

  return Promise.all(promises).then(res => {
    // res is an array of responses
    const results = res.map(r => r.json); // array of arrays of js objects
    return Array.prototype.concat.apply([], results); // flatten array
  });
};

module.exports = {
  key: 'paging',
  noun: 'Paging',

  display: {
    label: 'Get Paging',
    description: 'Triggers on a new paging.'
  },

  operation: {
    inputFields: [],
    perform: performPaging
  }
};
