import type { ImportDeclarationStructure, OptionalKind } from 'ts-morph';
import type { InterfaceOverridesMap, TypeOverrideMap } from './types.ts';

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
    namedImports: ['DynamicInputFields'],
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

const InputFieldsTypeParam = {
  name: '$InputFields',
  constraint: 'DynamicInputFields',
  default: 'never',
};

export const INTERFACE_OVERRIDES: InterfaceOverridesMap = {
  '/AppSchema': {
    properties: {
      beforeRequest: 'BeforeRequestMiddleware | BeforeRequestMiddleware[]',
      afterResponse: 'AfterResponseMiddleware | AfterResponseMiddleware[]',
    },
  },
  '/TriggerSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      operation:
        'BasicPollingOperation<$InputFields> | BasicHookOperation<$InputFields> | BasicHookToPollOperation<$InputFields>',
    },
  },
  '/BasicPollingOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'Request | PollingTriggerPerform<$InputFields>',
    },
  },
  '/BasicHookOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'WebhookTriggerPerform<$InputFields>',
      performList: 'Request | WebhookTriggerPerformList<$InputFields>',
      performSubscribe:
        'Request | WebhookTriggerPerformSubscribe<$InputFields>',
      performUnsubscribe:
        'Request | WebhookTriggerPerformUnsubscribe<$InputFields>',
    },
  },
  '/BasicHookToPollOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      performList: 'Request | HookToPollTriggerPerformList<$InputFields>',
      performSubscribe:
        'Request | HookToPollTriggerPerformSubscribe<$InputFields>',
      performUnsubscribe:
        'Request | HookToPollTriggerPerformUnsubscribe<$InputFields>',
    },
  },
  '/BasicCreateActionOperationSchema': {
    self: { typeParameters: [InputFieldsTypeParam] },
    properties: {
      inputFields: '$InputFields',
      perform: 'Request | CreatePerform<$InputFields>',
      performResume: 'CreatePerformResume<$InputFields>',
      performGet: 'Request | CreatePerformGet<$InputFields>',
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
  '/DynamicInputFieldsSchema': () => {}, // Do nothing. Replaced by import from ./inputs.
};
