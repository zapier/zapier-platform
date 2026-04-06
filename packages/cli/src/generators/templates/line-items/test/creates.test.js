/* globals describe, expect, test */

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('creates', () => {
  test('create order with line items', async () => {
    const bundle = {
      inputData: {
        name: 'Test Order',
        line_items: [
          { product_name: 'Pens', quantity: 12, price: 1.5 },
          { product_name: 'Notebooks', quantity: 3, price: 8.99 },
        ],
      },
    };
    const result = await appTester(
      App.creates.order.operation.perform,
      bundle,
    );
    const body = JSON.parse(result.data);
    expect(body.name).toBe('Test Order');
    expect(body.line_items).toHaveLength(2);
    expect(body.line_items[0].product_name).toBe('Pens');
    expect(body.line_items[1].quantity).toBe(3);
  });
});
