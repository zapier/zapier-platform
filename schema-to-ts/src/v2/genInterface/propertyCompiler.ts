import { docStringLines, type CompilerContext } from '../helpers.ts';
import type { InterfaceDeclaration } from 'ts-morph';
import type { JSONSchema4 } from 'json-schema';

export abstract class PropertyCompiler<$Property extends JSONSchema4> {
  abstract test(value: unknown): value is $Property;

  abstract compile(args: CompilePropertyArgs<$Property>): void;

  /**
   * Add a property to the interface with the text of the `type` and
   * `docs`.
   *
   * @example
   * ```ts
   * addPlainProperty({
   *   iface,
   *   key: 'name',
   *   required: true,
   *   type: 'string',
   *   docs: 'The name of the user'
   * });
   *
   * // will add:
   * // /**
   * //  * The name of the user
   * //  * /
   * // name: string;
   * ```
   */
  addPlainProperty({
    iface,
    key,
    required,
    docs,
    type,
  }: CompilePlainPropertyArgs): void {
    iface.addProperty({
      leadingTrivia: '\n',
      hasQuestionToken: !required,
      name: key,
      type,
      docs: docStringLines(docs),
    });
  }
}

export type CompilePropertyArgs<$Property extends JSONSchema4> = {
  ctx: CompilerContext;
  iface: InterfaceDeclaration;
  key: string;
  value: $Property;
  required: boolean;
};

export type CompilePlainPropertyArgs = {
  /** Interface to add the property to */
  iface: InterfaceDeclaration;

  /** Key of the property */
  key: string;

  /** Whether the property is required */
  required: boolean;

  /** Documentation for the property. Single string will be wrapped. */
  docs: string | undefined;

  /**
   * The literal type to inject, as a real type name/etc.
   *
   * @example
   * "string"
   * "number | boolean"
   */
  type: string;
};
