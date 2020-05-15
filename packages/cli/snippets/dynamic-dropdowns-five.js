perform: async (z, bundle) => {
  const response = await z.request('https://example.com/api/v2/projects.json', {
    params: {
      spreadsheet_id: bundle.inputData.spreadsheet_id,
    },
  });
  return response.data;
};
