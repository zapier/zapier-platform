'use strict';

const makeSchema = require('../utils/makeSchema');

module.exports = makeSchema({
  id: '/BufferConfigSchema',
  description:
    'Currently an **internal-only** feature. Zapier uses this configuration for creating objects in bulk.',
  type: 'object',
  required: ['groupedBy', 'limit'],
  properties: {
    groupedBy: {
      description:
        'The list of keys of input fields to group bulk-create with. The actual user data provided for the fields will be used during execution. Note that a required input field should be referenced to get user data always.',
      type: 'array',
      minItems: 1,
    },
    limit: {
      description:
        "The maximum number of items to call `performBuffer` with. **Note** that it is capped by the platform to prevent exceeding the [AWS Lambda's request/response payload size quota of 6 MB](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html#function-configuration-deployment-and-execution). Also, the execution is time-bound; we recommend reducing it upon consistent timeout.",
      type: 'integer',
    },
  },
  examples: [
    {
      groupedBy: ['workspace', 'sheet'],
      limit: 100,
    },
  ],
  antiExamples: [
    {
      example: {
        groupedBy: [],
        limit: 100,
      },
      reason: 'Empty groupedBy list provided: `[]`.',
    },
    {
      example: { groupedBy: ['workspace'] },
      reason: 'Missing required key: `limit`.',
    },
    {
      example: { limit: 1 },
      reason: 'Missing required key: `groupedBy`.',
    },
  ],
  additionalProperties: false,
});
