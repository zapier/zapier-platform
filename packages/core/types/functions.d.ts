import type { Bundle, ZObject } from './custom';

export type PollingTriggerPerform<
  $Input extends Record<string, any>,
  $Return extends { id: string } = { id: string }, // Primary key stuff later?
> = (z: ZObject, bundle: Bundle<$Input>) => $Return[] | Promise<$Return[]>;

/**
 * Process the data of a webhook sent to Zapier.
 *
 * The data from the webhook that activated this function is available
 * in `bundle.cleanedRequest` (and `bundle.rawRequest`).
 */
export type WebhookTriggerPerform<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return[] | Promise<$Return[]>;

/**
 * Pull sample data from the webhook trigger. Try to make these resemble
 * to data of the hooks as closely as possible.
 */
export type WebhookTriggerPerformList<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return[] | Promise<$Return[]>;

/**
 * Return must be an object of subscription data. It will be passed as
 * `bundle.subscribeData` in the performUnsubscribe function.
 */
export type WebhookTriggerPerformSubscribe<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Unsubscribe from the webhook.
 * Data from the subscribe function is provided in `bundle.subscribeData`.
 */
export type WebhookTriggerPerformUnsubscribe<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

// type HookToPollTriggerSubscribe = () => {}; // Same as Webhook
// type HookToPollTriggerUnsubscribe = () => {}; // Same as Webhook
// type HookToPollTriggerPerformList = () => {}; // Same as Webhook

/**
 * Pull data from the API service, same as a polling trigger.
 */
export type HookToPollTriggerPerformList<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return[] | Promise<$Return[]>;

/**
 * Return must be an object of subscription data. It will be passed as
 * `bundle.subscribeData` in the performUnsubscribe function.
 */
export type HookToPollTriggerPerformSubscribe<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Unsubscribe from the HookToPoll.
 * Data from the subscribe function is provided in `bundle.subscribeData`.
 */
export type HookToPollTriggerPerformUnsubscribe<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Create an item on a partner API.
 *
 * Usually returns the created object, but `performGet` can also be used
 * to populate more data.
 */
export type CreatePerform<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * A `perform` function can setup a partner API to call back to this
 * create action, allowing for arbitrary long delays for processing etc
 * to happen on the partner's side.
 *
 * `perform` can use `z.generateCallbackUrl()` to get a URL that will
 * trigger this function when it is ready.
 *
 * There are three sources of data:
 * - bundle.inputData: the original input field data
 * - bundle.cleanedRequest: the request data that was sent to the
 *                          callback url to trigger this resumption.
 * - bundle.outputData: The output data from the original `perform`.
 */
export type CreatePerformResume<
  $Input extends Record<string, any>,
  // TODO: Type cleanedRequest & outputData on Bundle interface
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Look up an object to populate it after creation?
 */
export type CreatePerformGet<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Search for objects on a partner API.
 *
 * Returns an 1-item array of objects, matching the search query.
 *
 * @remarks
 * This type requires a one-item array. Multiple items *can* be
 * returned, but will be ignored, hence the strictness. Maybe we
 * revisit this?
 */
export type SearchPerform<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => [$Return] | Promise<[$Return]>;

/**
 * Follow up a search's perform with additional data.
 *
 * TO CLARIFY: Is bundle.inputData just the result of searchPerform, or
 * are inputFields also provided.
 * -> PROBABLY: Just the result of searchPerform, no inputFields.
 */
export type SearchPerformGet<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 *
 */
export type SearchPerformResume<
  $Input extends Record<string, any>,
  $Return extends {} = {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Produce the URL to send the user to authorise with the OAuth2 provider.
 * You probably just want to use a {url:''} style object here, but
 * you can also use a function.
 *
 * The values of the auth input fields will be given as
 * `bundle.inputData`.
 */
export type OAuth2AuthorizeUrl<$Input extends Record<string, any>> = (
  z: ZObject,
  bundle: Bundle<$Input>,
) => string | Promise<string>;

/**
 * Get an object of Auth data, typically including an access and refresh
 * token, after the user has authorised your app.
 *
 * The returned data will be made available through the app as the
 * `bundle.authData` object.
 *
 * `bundle.inputData` will be a combination of the auth input fields,
 * and the OAuth redirect query parameters.
 *
 * @example
 * const getAccessToken = async (z, bundle) => {
 *   const { code, redirect_uri } = bundle.inputData;
 *
 * };
 *
 * Data Sources:
 * - bundle.inputData: The auth input fields, and the OAuth redirect
 *                     query parameters.
 * - bundle.cleanedRequest: The request data that was sent to the
 *                          OAuth2 provider.
 * - bundle.rawRequest: The raw request data that was sent to the
 *                      OAuth2 provider.
 */
export type OAuth2GetAccessToken<
  $Input extends Record<string, any>,
  $Return extends {},
> = (z: ZObject, bundle: Bundle<$Input>) => $Return | Promise<$Return>;

/**
 * Refresh the app's auth data.
 *
 * Typically performs grant_type:'refresh_token', exchanging the refresh
 * token for fresh data.
 *
 * The returned data is merged (TODO: clarify) the existing
 * apps bundle.authData from that point onwards.
 *
 * @example
 * const refreshAccessToken = async (z, bundle) => {
 *   const { refresh_token } = bundle.authData;
 *   const { access_token } = await z.request.post('https://api.example.com/token', {
 *     // TODO: Example
 *   });
 * };
 */
export type OAuth2RefreshAccessToken = () => {};

// Other Auths stuff?

// const DEFAULT_BUNDLE = {
//   authData: {},
//   inputData: {},
//   meta: {},
//   subscribeData: {},
//   targetUrl: '',
// };
