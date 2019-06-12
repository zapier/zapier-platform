perform: () => {
  return z
    .request('http://example.com/api/v2/projects.json', {
      params: {
        spreadsheet_id: bundle.inputData.spreadsheet_id
      }
    })
    .then(response => z.JSON.parse(response.content));
};
