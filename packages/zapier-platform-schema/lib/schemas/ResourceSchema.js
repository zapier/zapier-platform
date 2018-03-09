'use strict';

const makeSchema = require('../utils/makeSchema');

const ResourceMethodGetSchema = require('./ResourceMethodGetSchema');
const ResourceMethodHookSchema = require('./ResourceMethodHookSchema');
const ResourceMethodListSchema = require('./ResourceMethodListSchema');
const ResourceMethodSearchSchema = require('./ResourceMethodSearchSchema');
const ResourceMethodCreateSchema = require('./ResourceMethodCreateSchema');
const DynamicFieldsSchema = require('./DynamicFieldsSchema');
const KeySchema = require('./KeySchema');

module.exports = makeSchema(
  {
    id: '/ResourceSchema',
    description:
      'Represents a resource, which will in turn power triggers, searches, or creates.',
    type: 'object',
    required: ['key', 'noun'],
    examples: [
      {
        key: 'tag',
        noun: 'Tag',
        get: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags/{{inputData.id}}'
            },
            sample: {
              id: 385,
              name: 'proactive enable ROI'
            }
          }
        }
      },
      {
        key: 'tag',
        noun: 'Tag',
        sample: {
          id: 385,
          name: 'proactive enable ROI'
        },
        get: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags/{{inputData.id}}'
            }
            // resource sample is used
          }
        }
      },
      {
        key: 'tag',
        noun: 'Tag',
        get: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.',
            hidden: true
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags/{{inputData.id}}'
            }
          }
        },
        list: {
          display: {
            label: 'New Tag',
            description: 'Trigger when a new Tag is created in your account.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags'
            },
            sample: {
              id: 385,
              name: 'proactive enable ROI'
            }
          }
        }
      }
    ],
    antiExamples: [
      {
        key: 'tag',
        noun: 'Tag',
        get: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags/{{inputData.id}}'
            }
            // missing sample (and no sample on resource)
          }
        },
        list: {
          display: {
            label: 'New Tag',
            description: 'Trigger when a new Tag is created in your account.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags'
            },
            sample: {
              id: 385,
              name: 'proactive enable ROI'
            }
          }
        }
      },
      {
        key: 'tag',
        noun: 'Tag',
        get: {
          display: {
            label: 'Get Tag by ID',
            description: 'Grab a specific Tag by ID.'
          },
          operation: {
            perform: {
              url: 'http://fake-crm.getsandbox.com/tags/{{inputData.id}}'
            }
            // missing sample (and no sample on resource)
          }
        }
      }
    ],
    properties: {
      key: {
        description: 'A key to uniquely identify this resource.',
        $ref: KeySchema.id
      },
      noun: {
        description:
          'A noun for this resource that completes the sentence "create a new XXX".',
        type: 'string',
        minLength: 2,
        maxLength: 255
      },
      // TODO: do we need to break these all apart too? :-/
      get: {
        description: ResourceMethodGetSchema.schema.description,
        $ref: ResourceMethodGetSchema.id
      },
      hook: {
        description: ResourceMethodHookSchema.schema.description,
        $ref: ResourceMethodHookSchema.id
      },
      list: {
        description: ResourceMethodListSchema.schema.description,
        $ref: ResourceMethodListSchema.id
      },
      search: {
        description: ResourceMethodSearchSchema.schema.description,
        $ref: ResourceMethodSearchSchema.id
      },
      create: {
        description: ResourceMethodCreateSchema.schema.description,
        $ref: ResourceMethodCreateSchema.id
      },
      outputFields: {
        description: 'What fields of data will this return?',
        $ref: DynamicFieldsSchema.id
      },
      sample: {
        description: 'What does a sample of data look like?',
        type: 'object',
        // TODO: require id, ID, Id property?
        minProperties: 1
      }
    },
    additionalProperties: false
  },
  [
    ResourceMethodGetSchema,
    ResourceMethodHookSchema,
    ResourceMethodListSchema,
    ResourceMethodSearchSchema,
    ResourceMethodCreateSchema,
    DynamicFieldsSchema,
    KeySchema
  ]
);
