module.exports = {
  key: 'dessert',
  noun: 'Dessert',
  display: {
    label: 'Order Dessert',
    description: 'Orders a dessert.',
  },
  operation: {
    inputFields: [
      {
        key: 'type',
        required: true,
        choices: { 1: 'cake', 2: 'ice cream', 3: 'cookie' },
        altersDynamicFields: true,
      },
      function (z, bundle) {
        if (bundle.inputData.type === '2') {
          return [{ key: 'with_sprinkles', type: 'boolean' }];
        }
        return [];
      },
    ],
    perform: function (z, bundle) {
      /* ... */
    },
  },
};
