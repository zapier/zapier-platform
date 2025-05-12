import type { BaseApp, Search, Trigger, Create } from './schemas.generated';

/**
 * A full Zapier Integration, including all triggers, creates, and
 * searches, hydrators, and more.
 *
 * @remarks
 * This type is extends the `BaseApp` type which itself deliberately
 * omits the `triggers`, `creates`, and `searches` properties, in favour
 * of better logic that makes them concretely defined when they exist.
 * This was done because the schemas mark them as always-optional, when
 * we want them to be exist if any trigger/create/search are added.
 */
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
