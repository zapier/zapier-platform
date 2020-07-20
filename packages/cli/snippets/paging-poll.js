// some async call
const makeCall = (z, start, limit) => {
  return z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      _start: start,
      _limit: limit,
    },
  });
};

// triggers on paging with a certain tag
const performPaging = async (z, bundle) => {
  // array of promises
  const promises = [];

  // 5 requests with page size = 3
  let start = 0;
  const limit = 3;
  for (let i = 0; i < 5; i++) {
    promises.push(makeCall(z, start, limit));
    start += limit;
  }

  // send requests concurrently
  const responses = await Promise.all(promises);
  return responses.map((res) => res.data);
};

module.exports = {
  key: 'paging',
  noun: 'Paging',

  display: {
    label: 'Get Paging',
    description: 'Triggers on a new paging.',
  },

  operation: {
    inputFields: [],
    perform: performPaging,
  },
};
