import type { InputField } from './schemas.generated';
import type { ZObject, Bundle } from './custom';

// #region UTILITIES

/**
 * Squash complex intersections into a flat type. Improves readability
 * of the generated types.
 *
 * @example
 * type result = Simplify<{ a: string } & { b: boolean }>;
 * // { a: string, b: boolean }
 */
type Simplify<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Determine if an array type is generic, like T[]. This lets us
 * distinguish between tuples that have positional information, and a
 * generic array that treats all elements the same.
 *
 * @example
 * type result1 = JustArray<string[]>;
 * // true
 *
 * type result2 = JustArray<[string, number]>;
 * // false
 */
type JustArray<T> = T extends unknown[]
  ? T extends readonly [unknown, ...unknown[]]
    ? false
    : true
  : false;

/**
 * @link https://github.com/type-challenges/type-challenges/issues/737
 * @example
 * type result = UnionToIntersection<{ foo: string } | { bar: string }>;
 * // { foo: string } & { bar: string }
 */
type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0
  ? I
  : never;

/**
 * @link https://github.com/type-challenges/type-challenges/issues/737
 * @example
 * type result = LastInUnion<1 | 2>;
 * // 2
 */
type LastInUnion<U> =
  UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (
    x: infer L,
  ) => 0
    ? L
    : never;

/**
 * @link https://github.com/type-challenges/type-challenges/issues/737
 * @example
 * type result = UnionToTuple<1 | 2>;
 * // [1, 2]
 */
type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

/**
 * Flatten a tuple of tuples into a single tuple.
 *
 * @example
 * type result = Flatten<[[1, 2], [3, 4]]>;
 * // [1, 2, 3, 4]
 */
type Flatten<S extends unknown[], T extends unknown[] = []> = S extends [
  infer X,
  ...infer Y,
]
  ? X extends unknown[]
    ? Flatten<[...X, ...Y], T>
    : Flatten<[...Y], [...T, X]>
  : T;

/**
 * Merge an array (tuple) of object types into a single type. This is
 * the critical step in going from list of field definitions to a
 * bundle's inputData object.
 *
 * @example
 * type result = Merge<[{ a: string }, { b: boolean }]>
 * // { a: string, b: boolean }
 */
type Merge<T extends object[]> = T extends [infer F, ...infer R]
  ? F & Merge<Extract<R, object[]>>
  : {};

// #endregion

// MAIN BITS
// =========

/**
 * All of the field types a Zapier field can have, as defined by
 * zapier-platform-schema.
 */
type SchemaFieldTypes = NonNullable<InputField['type']>;

/**
 * Lookup of zapier field types (as defined by zapier-platform-schema)
 * to their corresponding TypeScript types. Dates and files are just
 * strings.
 */
type FieldResultTypes = {
  [$FieldType in SchemaFieldTypes]: $FieldType extends
    | 'string'
    | 'text'
    | 'datetime'
    | 'file'
    | 'password'
    | 'code'
    ? string
    : $FieldType extends 'number' | 'integer'
      ? number
      : $FieldType extends 'boolean'
        ? boolean
        : never; // Ignore `copy` and any other non-value types
};

/**
 * Get the TypeScript type that corresponds to the zapier field type. If
 * `type` is not set, the field defaults to `string`.
 */
type FieldResultType<F extends InputField> = F extends {
  type: infer $T extends InputField['type'];
}
  ? $T extends string
    ? FieldResultTypes[$T]
    : string
  : string;

/**
 * A function that returns a list of plain fields, sync or async.
 * Can be used as a member of an array of input fields itself.
 */
export type InputFieldFunction<
  $InputData extends Record<string, unknown> = never,
> = (
  z: ZObject,
  bundle: Bundle<$InputData>,
) => InputField[] | Promise<InputField[]>;

/**
 * Input fields can be plain fields, or functions that return plain
 * fields, async or not.
 */
export type DynamicInputField = InputField | InputFieldFunction;
export type DynamicInputFields = DynamicInputField[];

/**
 * Extract the "contribution" of a plain field to the bundle. Just the
 * field's key mapped to its corresponding TypeScript type. The result
 * will be optionally defined if the `required` flag is false or
 * omitted. Fields that have an undefined value type will be removed
 * from the type, and thus contribute nothing to the bundle.
 *
 * @example
 * type result1 = PlainFieldContribution<{ key: "a"; type: "string", required: true }>;
 * // { a: string }
 *
 * type result2 = PlainFieldContribution<{ key: "b"; type: "integer", required: false }>;
 * // { b?: number | undefined }
 *
 * type result3 = PlainFieldContribution<{ key: "c"; type: "boolean" }>;
 * // { c?: boolean | undefined }
 */
type PlainFieldContribution<$Field extends InputField> = $Field extends {
  required: true;
}
  ? FieldResultType<$Field> extends never
    ? {}
    : Record<$Field['key'], FieldResultType<$Field>>
  : FieldResultType<$Field> extends never
    ? {}
    : Partial<Record<$Field['key'], FieldResultType<$Field>>>;

/**
 * Extract the contribution of multiple plain fields defined in an
 * array (tuple) to the bundle.
 *
 * @example
 * type result = PlainFieldArrayContribution<[
 *   { key: "a"; type: "string", required: true },
 *   { key: "b"; type: "integer", required: false }
 * ]>;
 * // { a: string, b?: number | undefined }
 */
type PlainFieldArrayContribution<$Fields extends InputField[]> = Simplify<
  Merge<{
    [K in keyof $Fields]: PlainFieldContribution<$Fields[K]>;
  }>
>;

/**
 * A function that returns a list of plain fields, sync or async.
 *
 * If the fields this function returns are known, they will be included
 * in the resulting bundle's inputs as optional. Otherwise the
 * contribution  of this function's fields will be `Record<string,
 * unknown>`, because the field IDs can't be known ahead of time.
 */
type FieldFunction<
  $InputData extends Record<string, unknown> = {},
  $Output extends InputField[] = InputField[],
> = (z: ZObject, bundle: Bundle<$InputData>) => $Output | Promise<$Output>;

/**
 * Get all possible fields a field function MAY return. This is the
 * union of all possible fields, combined and flattened into tuple form
 * that can be normalised into a bundle contribution object.
 */
type FieldFunctionResult<
  $Func extends (...args: never) => InputField[] | Promise<InputField[]>,
> = Flatten<UnionToTuple<Awaited<ReturnType<$Func>>>>;

/**
 * Get the bundle contribution of a field function that has known field
 * results. All fields returned by functions are considered optional, so
 * each contributed field's presence in the bundle becomes optional.
 *
 * @example
 * const fieldFunction = (async (z, bundle) => {
 *   if (bundle.inputData.isAdmin) {
 *     return [{ key: "number_field", type: "number", required: true }] as const;
 *   }
 *   return [{ key: "text_field", type: "text", required: true }] as const;
 * }) satisfies FieldFunction<{ isAdmin: boolean }>;
 *
 * type result = FieldFunctionContribution<typeof fieldFunction>;
 * // {
 * //   number_field?: number | undefined;
 * //   text_field?: string | undefined;
 * // }
 */
type KnownFieldFunctionContribution<
  $Func extends (...args: never) => InputField[] | Promise<InputField[]>,
> =
  FieldFunctionResult<$Func> extends InputField[]
    ? Partial<PlainFieldArrayContribution<FieldFunctionResult<$Func>>>
    : never;

/**
 * Get the contribution of a field function. If the field function
 * returns known named fields, extract them and their types for the
 * bundle. Otherwise, return a record of unknown key/value pairs because
 * we can't know what the fields will be ahead of time.
 *
 * @example
 * const knownFieldFunction = ((z, bundle) => [
 *   { key: "field_a", type: "text", required: true },
 *   { key: "field_b", type: "integer", required: false },
 * ]) satisfies FieldFunction;
 *
 * type result = FieldFunctionContribution<typeof knownFieldFunction>;
 * // {
 * //   field_a?: string | undefined;
 * //   field_b?: number | undefined;
 * // }
 *
 * const unknownFieldFunction = (async (z, bundle) => {
 *   return [] as SchemaInputField[];
 * }) satisfies FieldFunction;
 *
 * type result = FieldFunctionContribution<typeof unknownFieldFunction>;
 * // Record<string, unknown>
 */
type FieldFunctionContribution<$F> = $F extends (
  ...args: never
) => InputField[] | Promise<InputField[]>
  ? Awaited<ReturnType<$F>> extends InputField[]
    ? JustArray<Awaited<ReturnType<$F>>> extends true
      ? Record<string, unknown> // Unknown fields
      : KnownFieldFunctionContribution<$F> // Known fields
    : never
  : never;

// PUTTING IT ALL TOGETHER
// =======================
//
// These last types are where everything comes together. Note that in
// this module, the more precise term "Contribution" is used to describe
// the fields that a plain field or field function will contribute to
// the bundle, but the more straightforward term "InputsShape" is
// exposed to for the public API.

/**
 * Get the bundle contribution of a single field. This is either a plain
 * field, or a field function.
 */
type InputInputDataContribution<$Input extends DynamicInputField> =
  $Input extends InputField
    ? PlainFieldContribution<$Input>
    : $Input extends (...args: never) => InputField[] | Promise<InputField[]> // Conditional field function
      ? FieldFunctionContribution<$Input>
      : never;

/**
 * Get the shape of bundle.inputData, given the array of input fields.
 * This array can contain plain fields and field functions.
 */
export type InferInputData<$InputFields extends readonly DynamicInputField[]> =
  Simplify<
    Merge<
      [
        ...{
          [K in keyof $InputFields]: InputInputDataContribution<
            $InputFields[K]
          >;
        },
      ]
    >
  >;

/**
 * Helper function to simplify declaring a function with a set of
 * existing input fields.
 */
export type InputFieldFunctionWithInputs<
  $Inputs extends DynamicInputFields = [],
> = (
  z: ZObject,
  bundle: Bundle<InferInputData<$Inputs>>,
) => InputField[] | Promise<InputField[]>;
