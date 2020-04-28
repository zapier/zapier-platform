perform: () => {
  return z
    .request('https://example.com/api/v2/projects.json', {
      params: {
        spreadsheet_id: bundle.inputData.spreadsheet_id
      }
    })
    .then(response => response.json);
};
