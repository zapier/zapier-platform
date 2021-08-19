const App = {
  // ...
  triggers: {
    // ...
    issue: {
      key: 'new_records',
      // ...
      operation: {
        inputFields: [
          {
            key: 'spreadsheet_id',
            required: true,
            label: 'Spreadsheet',
            dynamic: 'spreadsheet.id.name',
          },
          {
            key: 'worksheet_id',
            required: true,
            label: 'Worksheet',
            dynamic: 'worksheet.id.name',
          },
        ],
      },
    },
  },
};
