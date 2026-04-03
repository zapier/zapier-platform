# line-items

An example integration demonstrating line item support. Line items are fields
with a `children` property that represent structured, repeating data — like rows
in a spreadsheet or items in an order.

## Testing with `zapier-platform invoke`

```bash
# Non-interactive with JSON input
zapier-platform invoke create order --non-interactive \
  -i '{"name": "My Order", "line_items": [{"product_name": "Pens", "quantity": "12", "price": "1.50"}]}'

# Interactive mode — use the line item editing UI
zapier-platform invoke create order -i '{"name": "My Order"}'
```
