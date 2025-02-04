'use strict';

const makeSchema = require('../utils/makeSchema');

const { INCOMPATIBLE_FIELD_SCHEMA_KEYS } = require('../constants');

// the following takes an array of string arrays (string[][]) and returns the follwing string:
// * `a` & `b`
// * `c` & `d`
// ... etc
const wrapInBackticks = (s) => `\`${s}\``;
const formatBullet = (f) => `* ${f.map(wrapInBackticks).join(' & ')}`;
const incompatibleFieldsList =
  INCOMPATIBLE_FIELD_SCHEMA_KEYS.map(formatBullet).join('\n');

module.exports = makeSchema({
  id: '/FieldSchema',
  description: `In addition to the requirements below, the following keys are mutually exclusive:\n\n${incompatibleFieldsList}`,
  type: 'object',
  required: ['key'],
  docAnnotation: { hide: true },
  properties: {
    key: {
      description:
        'A unique machine readable key for this value (IE: "fname").',
      type: 'string',
      minLength: 1,
    },
    label: {
      description: 'A human readable label for this value (IE: "First Name").',
      type: 'string',
      minLength: 1,
    },
    type: {
      description:
        'The type of this value. Use `string` for basic text input, `text` for a large, `<textarea>` style box, and `code` for a `<textarea>` with a fixed-width font. Field type of `file` will accept either a file object or a string. If a URL is provided in the string, Zapier will automatically make a GET for that file. Otherwise, a .txt file will be generated.',
      type: 'string',
      // string == unicode
      // text == a long textarea string
      // integer == int
      // number == float
      enum: [
        'string',
        'text',
        'integer',
        'number',
        'boolean',
        'datetime',
        'file',
        'password',
        'copy',
        'code',
      ],
    },
    required: {
      description: 'If this value is required or not.',
      type: 'boolean',
    },
    default: {
      description:
        'A default value that is saved the first time a Zap is created.',
      type: 'string',
      minLength: 1,
    },
    list: {
      description:
        'Acts differently when used in inputFields vs. when used in outputFields. In inputFields: Can a user provide multiples of this field? In outputFields: Does this field return an array of items of type `type`?',
      type: 'boolean',
    },
    children: {
      type: 'array',
      items: { $ref: '/FieldSchema' },
      description:
        'An array of child fields that define the structure of a sub-object for this field. Usually used for line items.',
      minItems: 1,
    },
    dict: {
      description: 'Is this field a key/value input?',
      type: 'boolean',
    },
  },
  additionalProperties: false,
});
