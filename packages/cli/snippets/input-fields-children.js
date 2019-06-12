const App = {
  //...
  operation: {
    //...
    inputFields: [
      {
        key: 'lineItems',
        required: true,
        children: [
          {
            key: 'lineItemId',
            type: 'integer',
            label: 'Line Item ID',
            required: true
          },
          {
            key: 'name',
            type: 'string',
            label: 'Name',
            required: true
          },
          {
            key: 'description',
            type: 'string',
            label: 'Description'
          }
        ]
      }
    ]
    // ...
  }
};
