const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://httpbin.zapier-tooling.com/post',
    method: 'POST',
    body: {
      name: bundle.inputData.name,
      line_items: bundle.inputData.line_items,
    },
  });

  return response.data;
};

module.exports = {
  key: 'order',
  noun: 'Order',
  display: {
    label: 'Create Order',
    description: 'Creates a new order with line items.',
  },
  operation: {
    inputFields: [
      { key: 'name', required: true, type: 'string', label: 'Order Name' },
      {
        key: 'line_items',
        label: 'Line Items',
        children: [
          {
            key: 'product_name',
            type: 'string',
            label: 'Product Name',
            required: true,
          },
          {
            key: 'quantity',
            type: 'integer',
            label: 'Quantity',
            required: true,
          },
          { key: 'price', type: 'number', label: 'Unit Price' },
        ],
      },
    ],
    perform,
    sample: {
      id: 1,
      name: 'Stationery Order',
      line_items: [
        { product_name: 'Pens', quantity: 12, price: 1.5 },
        { product_name: 'Notebooks', quantity: 3, price: 8.99 },
      ],
    },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Order Name' },
      {
        key: 'line_items',
        label: 'Line Items',
        children: [
          { key: 'product_name', label: 'Product Name' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'price', label: 'Unit Price' },
        ],
      },
    ],
  },
};
