const performBuffer = async (z, bufferedBundle) => {
  // Grab the line items, preserving the order
  const rows = bufferedBundle.buffer.map(({ inputData }) => {
    return { title: inputData.title, year: inputData.year };
  });

  // Make the bulk-create API request
  const response = await z.request({
    method: 'POST',
    url: 'https://api.example.com/add_rows',
    body: {
      spreadsheet: bufferedBundle.groupedBy.spreadsheet,
      worksheet: bufferedBundle.groupedBy.worksheet,
      rows,
    },
  });

  // Create a matching result using the idempotency ID for each buffered invocation run.
  // The returned IDs will tell Zapier backend which items were successfully written.
  const result = {};
  bufferedBundle.buffer.forEach(({ inputData, meta }, index) => {
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

    // the performBuffer method must return a data just like this
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
    buffer: {
      groupedBy: ['spreadsheet', 'worksheet'],
      limit: 3,
    },
    performBuffer,
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
    outputFields: [{ key: 'id', type: 'string' }],
    sample: { id: '12345' },
  },
};
