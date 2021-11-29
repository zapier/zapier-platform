'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/RefResourceSchema',
  description:
    'Reference a resource by key and the data it returns. In the format of: `{resource_key}.{foreign_key}(.{human_label_key})`.',
  type: 'string',
  // the human_label_key should match the broad `string` type that FieldSchema.key can be, with commas!
  pattern:
    '^[a-zA-Z0-9_]+\\.[a-zA-Z0-9_\\s\\[\\]]+(\\.[a-zA-Z0-9_\\s\\[\\]]+(,[a-zA-Z0-9_\\s\\[\\]]+)*)?$',
  examples: [
    'contact.id',
    'contact.id.name',
    'contact.id.firstName,lastName',
    'contact.id.first_name,last_name,email',
    'contact.Contact Id.Full Name',
    'contact.data[]id.data[]First Name,data[]Last Name',
  ],
  antiExamples: [
    {
      example: 'Contact List',
      reason: 'Does not match resource_key pattern',
    },
    {
      example: 'Contact.list,find.id',
      reason: 'Does not match foreign_key pattern',
    },
    {
      example: 'Contact.list.id.full_name',
      reason: 'Does not match human_label_key pattern',
    },
  ],
});
