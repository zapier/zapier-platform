import { Create, Search, Trigger } from './schemas.generated';
import { InputFields } from './inputs';
import { App } from './app';

export declare function defineInputs<const $InputFields extends InputFields>(
  inputFields: $InputFields,
): $InputFields;

export declare function defineCreate<
  const $key extends string,
  const $InputFields extends InputFields,
>(create: Create<$key, $InputFields>): Create<$key, $InputFields>;

export declare function defineApp<
  const $Triggers extends Record<string, Trigger> | undefined = undefined,
  const $Creates extends Record<string, Create> | undefined = undefined,
  const $Searches extends Record<string, Search> | undefined = undefined,
>(
  app: App<$Triggers, $Creates, $Searches>,
): App<$Triggers, $Creates, $Searches>;
