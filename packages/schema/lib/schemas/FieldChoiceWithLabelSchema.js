'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FieldChoiceWithLabelSchema',
  description:
    "An object describing a labeled choice in a static dropdown. Useful if the value a user picks isn't exactly what the zap uses. For instance, when they click on a nickname, but the zap uses the user's full name ([image](https://cdn.zapier.com/storage/photos/8ed01ac5df3a511ce93ed2dc43c7fbbc.png)).",
  examples: [{ label: 'Red', sample: '#f00', value: '#f00' }],
  antiExamples: [{ label: 'Red', value: '#f00' }],
  type: 'object',
  required: ['value', 'sample', 'label'],
  properties: {
    value: {
      description:
        'The actual value that is sent into the Zap. Should match sample exactly.',
      type: 'string',
      minLength: 1,
    },
    sample: {
      description:
        "Displayed as light grey text in the editor. It's important that the value match the sample. Otherwise, the actual value won't match what the user picked, which is confusing.",
      type: 'string',
      minLength: 1,
    },
    label: {
      description: 'A human readable label for this value.',
      type: 'string',
      minLength: 1,
    },
  },
});
