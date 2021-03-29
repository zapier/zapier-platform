// the perform method of our trigger
// ensure operation.canPaginate is true!

const performWithoutAsync = (z, bundle) => {
  return Promise.resolve()
    .then(() => {
      if (bundle.meta.page === 0) {
        // first page, no need to fetch a cursor
        return Promise.resolve();
      } else {
        return z.cursor.get(); // Promise<string | null>
      }
    })
    .then((cursor) => {
      return z.request(
        'https://5ae7ad3547436a00143e104d.mockapi.io/api/recipes',
        {
          params: { cursor: cursor }, // if cursor is null, it's ignored here
        }
      );
    })
    .then((response) => {
      // need to save the cursor and return a promise, but also need to pass the data along
      return Promise.all([response.items, z.cursor.set(response.nextPage)]);
    })
    .then(([items /* null */]) => {
      return items;
    });
};

// ---------------------------------------------------

const performWithAsync = async (z, bundle) => {
  let cursor;
  if (bundle.meta.page) {
    cursor = await z.cursor.get(); // string | null
  }

  const response = await z.request(
    'https://5ae7ad3547436a00143e104d.mockapi.io/api/recipes',
    {
      // if cursor is null, it's sent as an empty query
      //   param and should be ignored by the server
      params: { cursor: cursor },
    }
  );

  // we successfully got page 1, should store the cursor in case the user wants page 2
  await z.cursor.set(response.nextPage);

  return response.items;
};
