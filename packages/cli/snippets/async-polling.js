// a hypothetical API where payloads are big so we want to heavily limit how much comes back
// we want to only return items created in the last hour

const asyncExample = async (z, bundle) => {
  const limit = 3;
  let start = 0;
  const twoHourMilliseconds = 60 * 60 * 2 * 1000;
  const hoursAgo = new Date() - twoHourMilliseconds;

  let response = await z.request({
    url: 'https://jsonplaceholder.typicode.com/posts',
    params: {
      _start: start,
      _limit: limit,
    },
  });

  let results = response.data; // response.json if you're using core v9 or older

  // keep paging until the last item was created over two hours ago
  // then we know we almost certainly haven't missed anything and can let
  //   deduper handle the rest

  while (new Date(results[results.length - 1].createdAt) > hoursAgo) {
    start += limit; // next page

    response = await z.request({
      url: 'https://jsonplaceholder.typicode.com/posts',
      params: {
        _start: start,
        _limit: limit,
      },
    });

    results = results.concat(response.data);
  }

  return results;
};
