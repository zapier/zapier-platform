const performBulk = async (z, bulkBundle) => {
  // Grab the line items, preserving the order
  const rows = bulkBundle.bulk.map(({inputData}) => {
    return {title: inputData.title, year: inputData.year};
  });

  // Make the bulk-write API request
  const response = await z.request({
    method: 'POST',
    url: 'https://api.example.com/add_rows',
    body: {
      spreadsheet: bulkBundle.groupedBy.spreadsheet,
      worksheet: bulkBundle.groupedBy.worksheet,
      rows,
    },
  });

  // Create a matching result using the idempotency ID for each buffered invovation run.
  // The returned IDs will tell Zapier backend which items were successfully written.
  const result = {};
  bulkBundle.bulk.forEach(({inputData, meta}, index) => {
    let error = '';
    let outputData = {};

    // assuming request order matches response and
    // response.data = {
    //   "rows": [
    //     {"id": "12910"},
    //     {"id": "92830"},
    //     {"error": "Not Created"},
    //     ...
    //   ]
    // }
    if (response.data.rows.length > index) {
      // assuming an error is returned with an "error" key in the response data
      if (response.data.rows[index].error) {
        error = response.data.rows[index].error;
      } else {
        outputData = response.data.rows[index];
      }
    }

    // the performBulk method must return a data just like this
    // {
    //   "idempotency ID 1": {
    //     "outputData": {"id": "12910"},
    //     "error": ""
    //   },
    //   "idempotency ID 2": {
    //     "outputData": {"id": "92830"},
    //     "error": ""
    //   },
    // "idempotency ID 3": {
    //     "outputData": {},
    //     "error": "Not Created"
    //   },
    //   ...
    // }
    result[meta.id] = { outputData, error };
  });

  return result;
};

module.exports = {
  key: 'add_rows',
  noun: 'Rows',
  display: {
    label: 'Add Rows',
    description: 'Add rows to a worksheet.',
  },
  operation: {
    bulk: {
      groupedBy: ['spreadsheet', 'worksheet'],
      limit: 3,
    },
    performBulk,
    inputFields: [
      {
        key: 'spreadsheet',
        type: 'string',
        required: true,
      },
      {
        key: 'worksheet',
        type: 'string',
        required: true,
      },
      {
        key: 'title',
        type: 'string',
      },
      {
        key: 'year',
        type: 'string',
      },
    ],
    outputFields: [
      { key: 'id', type: 'string' },
    ],
    sample: { id: '12345' },
  },
};
