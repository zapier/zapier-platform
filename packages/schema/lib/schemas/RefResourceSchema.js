'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/RefResourceSchema',
  description:
    'Reference a resource by key and the data it returns. In the format of: `{resource_key}.{foreign_key}(.{human_label_key})`.',
  type: 'string',
  pattern:
    '^[a-zA-Z0-9_]+\\.[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*)?$',
  examples: [
    'contact.id',
    'contact.id.name',
    'contact.id.firstName,lastName',
    'contact.id.first_name,last_name,email',
  ],
  antiExamples: [
    {
      example: 'Contact.list.id.full_name',
      reason: 'Does not match pattern',
    },
  ],
});
