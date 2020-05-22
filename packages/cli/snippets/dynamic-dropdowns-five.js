perform: async (z, bundle) => {
  const response = await z.request('https://example.com/api/v2/projects.json', {
    params: {
      spreadsheet_id: bundle.inputData.spreadsheet_id,
    },
  });

  // response.throwForStatus() if you're using core v9 or older

  return response.data; // or response.json if you're using core v9 or older
};
