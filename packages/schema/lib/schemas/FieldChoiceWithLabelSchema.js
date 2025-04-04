'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/FieldChoiceWithLabelSchema',
  description:
    "An object describing a labeled choice in a static dropdown. Useful if the value a user picks isn't exactly what the zap uses. For instance, when they click on a nickname, but the zap uses the user's full name ([image](https://cdn.zapier.com/storage/photos/8ed01ac5df3a511ce93ed2dc43c7fbbc.png)).",
  type: 'object',
  required: ['value', 'sample', 'label'],
  properties: {
    value: {
      description:
        'The actual value that is sent into the Zap. This is displayed as light grey text in the editor. Should match sample exactly.',
      type: 'string',
      minLength: 1,
    },
    sample: {
      description:
        'A legacy field that is no longer used by the editor, but it is still required for now and should match the value.',
      type: 'string',
      minLength: 1,
    },
    label: {
      description: 'A human readable label for this value.',
      type: 'string',
      minLength: 1,
    },
  },
  examples: [{ label: 'Red', sample: '#f00', value: '#f00' }],
  antiExamples: [
    {
      example: { label: 'Red', value: '#f00' },
      reason: 'Missing required key: sample',
    },
  ],
});
