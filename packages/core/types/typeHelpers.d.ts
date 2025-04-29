import type { Create, Search, Trigger } from './schemas.generated';
import type { InputField, InputFields } from './inputs';
import type { App } from './app';

export declare function defineInput<
  const $InputData extends Record<string, unknown>,
  const $InputField extends InputField<$InputData>,
>(input: $InputField): $InputField;

export declare function defineInputs<
  const $InputFields extends InputField<any>[],
>(inputFields: $InputFields): $InputFields;

export declare function defineCreate<
  const $key extends string,
  const $InputFields extends InputFields,
>(create: Create<$key, $InputFields>): Create<$key, $InputFields>;

export declare function defineTrigger<
  const $key extends string,
  const $InputFields extends InputFields,
>(trigger: Trigger<$key, $InputFields>): Trigger<$key, $InputFields>;

export declare function defineApp<
  const $Triggers extends Record<string, Trigger> | undefined = undefined,
  const $Creates extends Record<string, Create> | undefined = undefined,
  const $Searches extends Record<string, Search> | undefined = undefined,
>(
  app: App<$Triggers, $Creates, $Searches>,
): App<$Triggers, $Creates, $Searches>;
