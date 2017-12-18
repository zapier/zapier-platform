'use strict';

const makeSchema = require('../utils/makeSchema');

const FieldChoiceWithLabelSchema = require('./FieldChoiceWithLabelSchema');

module.exports = makeSchema(
  {
    id: '/FieldChoicesSchema',
    description:
      'A static dropdown of options. Which you use depends on your order and label requirements:\n\nNeed a Label? | Does Order Matter? | Type to Use\n---|---|---\nYes | No | Object of value -> label\nNo | Yes | Array of Strings\nYes | Yes | Array of [FieldChoiceWithLabel](#fieldchoicewithlabelschema)',
    examples: [{ a: '1', b: '2', c: '3' }, ['first', 'second', 'third']],
    antiExamples: [[1, 2, 3], [{ a: '1', b: '2', c: '3' }]],
    oneOf: [
      {
        type: 'object',
        minProperties: 1
      },
      {
        type: 'array',
        minItems: 1,
        items: {
          oneOf: [{ type: 'string' }, { $ref: FieldChoiceWithLabelSchema.id }]
        }
      }
    ]
  },
  [FieldChoiceWithLabelSchema]
);
