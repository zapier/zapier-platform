import type { Create, Search, Trigger } from './schemas.generated';
import type { InputField, InputFields } from './inputs';
import type { App } from './app';

/**
 * @deprecated use one of the following functions instead:
 * - defineStaticInputField
 * - defineKnownInputFieldsFunc
 * - defineCustomInputFieldsFunc
 */
export declare function defineInputField<
  const $InputData extends Record<string, unknown>,
  const $InputField extends InputField<$InputData>,
>(input: $InputField): $InputField;

export declare function defineInputFields<
  const $InputFields extends InputField<any>[],
>(inputFields: $InputFields): $InputFields;

export declare function defineCreate<
  const $Key extends string,
  const $InputFields extends InputFields,
>(create: Create<$Key, $InputFields>): Create<$Key, $InputFields>;

export declare function defineSearch<
  const $Key extends string,
  const $InputFields extends InputFields,
>(search: Search<$Key, $InputFields>): Search<$Key, $InputFields>;

export declare function defineTrigger<
  const $Key extends string,
  const $InputFields extends InputFields,
>(trigger: Trigger<$Key, $InputFields>): Trigger<$Key, $InputFields>;

export declare function defineApp<
  const $Triggers extends Record<string, Trigger> | undefined = undefined,
  const $Creates extends Record<string, Create> | undefined = undefined,
  const $Searches extends Record<string, Search> | undefined = undefined,
>(
  app: App<$Triggers, $Creates, $Searches>,
): App<$Triggers, $Creates, $Searches>;
