'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/RefResourceSchema',
  description:
    'Reference a resource by key and the data it returns. In the format of: `{resource_key}.{foreign_key}(.{human_label_key})`.',
  type: 'string',
  examples: [
    'contact.id',
    'contact.id.name',
    'contact.id.firstName,lastName',
    'contact.id.first_name,last_name,email',
  ],
  antiExamples: [
    'contact',
    'Contact.list.id.full_name',
    'contact.id,name',
    'cont,act.id,name',
    'contact',
    'contact.id.,,',
    'contact.id.a,,',
  ],
  pattern:
    '^[a-zA-Z0-9_]+\\.[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+(,[a-zA-Z0-9_]+)*)?$',
});
