import type { BaseApp, Search, Trigger, Create } from './schemas.generated';

export type App<
  $Triggers extends Record<string, Trigger> | undefined = undefined,
  $Creates extends Record<string, Create> | undefined = undefined,
  $Searches extends Record<string, Search> | undefined = undefined,
> = BaseApp & {
  triggers?: $Triggers;
  creates?: $Creates;
  searches?: $Searches;
} & ($Triggers extends undefined ? {} : { triggers: $Triggers }) &
  ($Creates extends undefined ? {} : { creates: $Creates }) &
  ($Searches extends undefined ? {} : { searches: $Searches });
