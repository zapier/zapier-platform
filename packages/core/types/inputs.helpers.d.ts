import { PlainInputField } from './schemas.generated';

// Base tuple type constraint of zero, one or more PlainInputs with their
// positions preserved in a tuple. Importantly, this is *not* an array.
type KnownInputFields = [] | [PlainInputField, ...PlainInputField[]];

/**
 * Used to capture the exact details of a plain input field.
 *
 * Typically used when an individual input field needs to be reused, rather than
 * being defined inline in a `defineInputFields([…])` array.
 *
 * This can be used to wrap any input field that is an object with a `key`
 * property, including simple input fields, `list` and `dict` inputs, and parent
 * inputs with an array of `children` input fields.
 *
 * @example
 * ```ts
 * const inputField = defineStaticInputField({
 *   key: 'some_key',
 *   label: 'Some Label',
 *   type: 'string',
 *   required: true,
 * });
 * ```
 */
export declare function defineStaticInputField<
  const $InputField extends PlainInputField,
>(inputField: $InputField): $InputField;

/**
 * Wraps a dynamic field function that always returns input fields with **known
 * keys** Returning **no** input fields is a valid option, but all return
 * branches must return exact tuples of zero, one, or more input fields with
 * pre-determined keys.
 *
 * If any of the input fields' keys cannot be known ahead of time, use
 * `defineCustomInputFieldsFunc` instead.
 *
 * @example
 * ```ts
 * const GET_EXTRA_ADMIN_FIELDS = defineKnownInputFieldsFunc((z, bundle) => {
 *   if (bundle.inputData.isAdmin) {
 *     return [{ key: 'admin_name', type: 'string', required: true }];
 *   }
 *   return []; // Zero inputs are ok.
 * });
 *
 * const inputFields = defineInputFields([
 *   GET_EXTRA_ADMIN_FIELDS, // By Name
 *
 *   // Or inline, known input fields are default required:
 *   (z, bundle) => {
 *     if (bundle.inputData.isAdmin) {
 *       return [{ key: 'admin_name', type: 'string', required: true }];
 *     }
 *     return [];
 *   },
 * ]);
 * ```
 */
export declare function defineKnownInputFieldsFunc<
  const $Result extends KnownInputFields | Promise<KnownInputFields>,
>(func: () => $Result): () => $Result;

/**
 * Wraps a dynamic field function that returns input fields with **unknown
 * keys**. Such fields are needed when inputs are fetched from an external API,
 * for example spreadsheet and database columns, or CRM entity fields.
 *
 * These functions MUST be defined as explicit constants separately from other
 * input fields, and cannot be defined inline in a `defineInputFields([…])`
 * array.
 *
 * @example
 * ```ts
 * const GET_REMOTE_FIELDS = defineCustomInputFieldsFunc((z, bundle) => {
 *   const resp = await z.request<ApiField[]>('https://api.example.com/fields');
 *   const remoteFields = resp.data;
 *   return remoteFields.map((field): PlainInputField => ({
 *     key: field.id,
 *     type: field.type.toLowerCase(),
 *     required: !field.optional,
 *   }));
 * });
 *
 * const inputFields = defineInputFields([
 *   // ...
 *   GET_REMOTE_FIELDS, // By name. CANNOT be defined inline.
 * ]);
 * ```
 */
export declare function defineCustomInputFieldsFunc<
  const $Result extends
    | KnownInputFields
    | Promise<KnownInputFields>
    | PlainInputField[]
    | Promise<PlainInputField[]>,
>(func: () => $Result): () => $Result;
