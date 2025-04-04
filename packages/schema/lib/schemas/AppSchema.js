'use strict';

const makeSchema = require('../utils/makeSchema');

const AuthenticationSchema = require('./AuthenticationSchema');
const FlatObjectSchema = require('./FlatObjectSchema');
const ResourcesSchema = require('./ResourcesSchema');
const TriggersSchema = require('./TriggersSchema');
const ReadBulksSchema = require('./BulkReadsSchema');
const SearchesSchema = require('./SearchesSchema');
const CreatesSchema = require('./CreatesSchema');
const SearchOrCreatesSchema = require('./SearchOrCreatesSchema');
const SearchAndCreatesSchema = require('./SearchAndCreatesSchema');
const RequestSchema = require('./RequestSchema');
const VersionSchema = require('./VersionSchema');
const MiddlewaresSchema = require('./MiddlewaresSchema');
const HydratorsSchema = require('./HydratorsSchema');
const AppFlagsSchema = require('./AppFlagsSchema');
const ThrottleObjectSchema = require('./ThrottleObjectSchema');

module.exports = makeSchema(
  {
    id: '/AppSchema',
    description: 'Represents a full app.',
    type: 'object',
    required: ['version', 'platformVersion'],
    properties: {
      version: {
        description: 'A version identifier for your code.',
        $ref: VersionSchema.id,
      },
      platformVersion: {
        description:
          'A version identifier for the Zapier execution environment.',
        $ref: VersionSchema.id,
      },
      beforeApp: {
        description:
          'EXPERIMENTAL: Before the perform method is called on your app, you can modify the execution context.',
        $ref: MiddlewaresSchema.id,
      },
      afterApp: {
        description:
          'EXPERIMENTAL: After the perform method is called on your app, you can modify the response.',
        $ref: MiddlewaresSchema.id,
      },
      authentication: {
        description: 'Choose what scheme your API uses for authentication.',
        $ref: AuthenticationSchema.id,
      },
      requestTemplate: {
        description:
          'Define a request mixin, great for setting custom headers, content-types, etc.',
        $ref: RequestSchema.id,
      },
      beforeRequest: {
        description:
          'Before an HTTP request is sent via our `z.request()` client, you can modify it.',
        $ref: MiddlewaresSchema.id,
      },
      afterResponse: {
        description:
          'After an HTTP response is recieved via our `z.request()` client, you can modify it.',
        $ref: MiddlewaresSchema.id,
      },
      hydrators: {
        description:
          "An optional bank of named functions that you can use in `z.hydrate('someName')` to lazily load data.",
        $ref: HydratorsSchema.id,
      },
      resources: {
        description:
          'All the resources for your app. Zapier will take these and generate the relevent triggers/searches/creates automatically.',
        $ref: ResourcesSchema.id,
      },
      triggers: {
        description:
          'All the triggers for your app. You can add your own here, or Zapier will automatically register any from the list/hook methods on your resources.',
        $ref: TriggersSchema.id,
      },
      bulkReads: {
        description:
          'All of the read bulks (GETs) your app exposes to retrieve resources in batches.',
        $ref: ReadBulksSchema.id,
      },
      searches: {
        description:
          'All the searches for your app. You can add your own here, or Zapier will automatically register any from the search method on your resources.',
        $ref: SearchesSchema.id,
      },
      creates: {
        description:
          'All the creates for your app. You can add your own here, or Zapier will automatically register any from the create method on your resources.',
        $ref: CreatesSchema.id,
      },
      searchOrCreates: {
        description:
          'All the search-or-create combos for your app. You can create your own here, or Zapier will automatically register any from resources that define a search, a create, and a get (or define a searchOrCreate directly). Register non-resource search-or-creates here as well.',
        $ref: SearchOrCreatesSchema.id,
      },
      searchAndCreates: {
        description: 'An alias for "searchOrCreates".',
        $ref: SearchAndCreatesSchema.id,
      },
      flags: {
        description: 'Top-level app options',
        $ref: AppFlagsSchema.id,
      },
      throttle: {
        description: `Zapier uses this configuration to apply throttling when the limit for the window is exceeded. When set here, it is the default throttle configuration used on each action of the integration. And when set in an action's operation object, it gets overwritten for that action only.`,
        $ref: ThrottleObjectSchema.id,
      },
      legacy: {
        description:
          '**INTERNAL USE ONLY**. Zapier uses this to hold properties from a legacy Web Builder app.',
        type: 'object',
        docAnnotation: {
          hide: true,
        },
      },
      firehoseWebhooks: {
        description:
          '**INTERNAL USE ONLY**. Zapier uses this for internal webhook app configurations.',
        type: 'object',
        docAnnotation: {
          hide: true,
        },
      },
    },
    additionalProperties: false,
    examples: [{ version: '1.0.0', platformVersion: '10.1.2' }],
    antiExamples: [
      {
        example: { version: 'v1.0.0', platformVersion: '10.1.2' },
        reason: 'Invalid value for version.',
      },
      {
        example: { version: '1.0.0', platformVersion: 'v10.1.2' },
        reason: 'Invalid value for platformVersion.',
      },
    ],
  },
  [
    AuthenticationSchema,
    FlatObjectSchema,
    ResourcesSchema,
    ReadBulksSchema,
    TriggersSchema,
    SearchesSchema,
    CreatesSchema,
    SearchOrCreatesSchema,
    SearchAndCreatesSchema,
    RequestSchema,
    VersionSchema,
    MiddlewaresSchema,
    HydratorsSchema,
    AppFlagsSchema,
    ThrottleObjectSchema,
  ],
);
