import type { ImportDeclarationStructure, OptionalKind } from 'ts-morph';
import {
  IGNORE_BUT_FOLLOW_REFS,
  type InterfaceOverridesMap,
  type TypeOverrideMap,
} from './types.ts';

import { docStringLines } from './comments.ts';

export const IMPORTS: OptionalKind<ImportDeclarationStructure>[] = [
  {
    isTypeOnly: true,
    moduleSpecifier: './custom',
    namedImports: [
      'AfterResponseMiddleware',
      'BeforeRequestMiddleware',
      'PerformFunction',
    ],
  },
  {
    isTypeOnly: true,
    moduleSpecifier: './inputs',
    namedImports: ['InputFields', 'InferInputData'],
  },
  {
    isTypeOnly: true,
    moduleSpecifier: './functions',
    namedImports: [
      'PollingTriggerPerform',
      'WebhookTriggerPerform',
      'WebhookTriggerPerformList',
      'WebhookTriggerPerformSubscribe',
      'WebhookTriggerPerformUnsubscribe',
      'HookToPollTriggerPerformList',
      'HookToPollTriggerPerformSubscribe',
      'HookToPollTriggerPerformUnsubscribe',
      'CreatePerform',
      'CreatePerformResume',
      'CreatePerformGet',
      'SearchPerform',
      'SearchPerformGet',
      'SearchPerformResume',
      'OAuth2AuthorizeUrl',
      'OAuth2GetAccessToken',
      'OAuth2RefreshAccessToken',
    ],
  },
];

const KeyTypeParam = {
  name: '$Key',
  constraint: 'string',
  default: 'string',
};

const InputFieldsTypeParam = {
  name: '$InputFields',
  constraint: 'InputFields',
  default: 'InputFields',
};

export const INTERFACE_OVERRIDES: InterfaceOverridesMap = {
  // AppSchema is renamed to BaseApp. The Triggers, Creates, and
  // Searches are deliberately omitted, and separately handled by a the
  // `App` type from `./apps.d.ts` in zapier-platform-core, which
  // extends this BaseApp type.
  '/AppSchema': {
    self: { name: 'BaseApp' },
    properties: {
      beforeRequest: 'BeforeRequestMiddleware | BeforeRequestMiddleware[]',
      afterResponse: 'AfterResponseMiddleware | AfterResponseMiddleware[]',
      creates: IGNORE_BUT_FOLLOW_REFS,
      triggers: IGNORE_BUT_FOLLOW_REFS,
      searches: IGNORE_BUT_FOLLOW_REFS,
    },
  },
  '/TriggerSchema': {
    self: { typeParameters: [KeyTypeParam, InputFieldsTypeParam] },
    properties: {
      key: '$Key',
      operation:
        'BasicPollingOperation<$InputFields> | BasicHookOperation<$InputFields> | BasicHookToPollOperation<$InputFields>',
    },
  },
  '/CreateSchema': {
    self: { typeParameters: [KeyTypeParam, InputFieldsTypeParam] },
    properties: {
      key: '$Key',
      operation: 'BasicCreateOperation<$InputFields>',
    },
  },
  '/SearchSchema': {
    self: { typeParameters: [KeyTypeParam, InputFieldsTypeParam] },
    properties: {
      key: '$Key',
      operation: 'BasicSearchOperation<$InputFields>',
    },
  },
  '/BasicPollingOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'Request | PollingTriggerPerform<InferInputData<$InputFields>>',
    },
  },
  '/BasicHookOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'WebhookTriggerPerform<InferInputData<$InputFields>>',
      performList:
        'Request | WebhookTriggerPerformList<InferInputData<$InputFields>>',
      performSubscribe:
        'Request | WebhookTriggerPerformSubscribe<InferInputData<$InputFields>>',
      performUnsubscribe:
        'Request | WebhookTriggerPerformUnsubscribe<InferInputData<$InputFields>>',
    },
  },
  '/BasicHookToPollOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      performList:
        'Request | HookToPollTriggerPerformList<InferInputData<$InputFields>>',
      performSubscribe:
        'Request | HookToPollTriggerPerformSubscribe<InferInputData<$InputFields>>',
      performUnsubscribe:
        'Request | HookToPollTriggerPerformUnsubscribe<InferInputData<$InputFields>>',
    },
  },
  '/BasicCreateOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'Request | CreatePerform<InferInputData<$InputFields>>',
      performResume: 'CreatePerformResume<InferInputData<$InputFields>>',
      performGet: 'Request | CreatePerformGet<InferInputData<$InputFields>>',
    },
  },
  '/BasicSearchOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'Request | SearchPerform<InferInputData<$InputFields>>',
      performGet: 'Request | SearchPerformGet<InferInputData<$InputFields>>',
      performResume: 'SearchPerformResume<InferInputData<$InputFields>>',
    },
  },
};

export const TYPE_OVERRIDES: TypeOverrideMap = {
  '/FunctionSchema': ({ file, typeName, schema }) => {
    file.addTypeAlias({
      name: typeName,
      isExported: true,
      docs: docStringLines(
        schema.description,
        '\n\n@deprecated Prefer using the perform types from the `functions` module.',
      ),
      type: 'PerformFunction',
      leadingTrivia: '\n',
    });
  },
  // Don't render this type as it's replaced by an import. We do want
  // the plain input field type it references to be rendered, though.
  '/InputFieldsSchema': IGNORE_BUT_FOLLOW_REFS,

  // Don't render these types because they're reimplemented by
  // apps.d.ts in zapier-platform-core
  '/TriggersSchema': IGNORE_BUT_FOLLOW_REFS,
  '/CreatesSchema': IGNORE_BUT_FOLLOW_REFS,
  '/SearchesSchema': IGNORE_BUT_FOLLOW_REFS,
};
