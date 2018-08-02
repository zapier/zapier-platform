'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/BasicDisplaySchema',
  description: 'Represents user information for a trigger, search, or create.',
  type: 'object',
  examples: [
    { label: 'New Thing', description: 'Gets a new thing for you.' },
    {
      label: 'New Thing',
      description: 'Gets a new thing for you.',
      directions: 'This is how you use the thing.',
      hidden: false,
      important: true
    }
  ],
  antiExamples: [
    { label: 'New Thing' },
    {
      label: 'New Thing',
      description: 'Gets a new thing for you.',
      important: 1
    }
  ],
  required: ['label', 'description'],
  properties: {
    label: {
      description:
        'A short label like "New Record" or "Create Record in Project".',
      type: 'string',
      minLength: 2,
      maxLength: 64
    },
    description: {
      description:
        'A description of what this trigger, search, or create does.',
      type: 'string',
      minLength: 12,
      maxLength: 1000
    },
    directions: {
      description:
        'A short blurb that can explain how to get this working. EG: how and where to copy-paste a static hook URL into your application. Only evaluated for static webhooks.',
      type: 'string',
      minLength: 12,
      maxLength: 1000
    },
    important: {
      description:
        'Affects how prominently this operation is displayed in the UI. Only mark a few of the most popular operations important.',
      type: 'boolean'
    },
    hidden: {
      description: 'Should this operation be unselectable by users?',
      type: 'boolean'
    }
  },
  additionalProperties: false
});
