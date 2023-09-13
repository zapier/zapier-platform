const perform = async (z, bundle) => {
  let cursor;

  // if fetching a page other than the first (first page is 0),
  // get the cursor stored after fetching the previous page.
  if (bundle.meta.page > 0) {
    cursor = await z.cursor.get();

    // if the previous page was the last one and cursor is empty/null,
    // return an empty array.
    if (!cursor) {
      return [];
    }
  }

  const response = await z.request(
    'https://5ae7ad3547436a00143e104d.mockapi.io/api/recipes',
    {
      // cursor typically is a param to pass along to the next request,
      // or the full URL for the next page of items.
      params: { cursor },
    }
  );

  // after fetching a page, set the returned cursor for the next page,
  // or empty/null if this was the last one.
  await z.cursor.set(response.nextPage);

  return response.items;
};
