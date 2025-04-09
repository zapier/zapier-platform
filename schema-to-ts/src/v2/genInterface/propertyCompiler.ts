import type { CompilerContext } from '../helpers.ts';
import type { InterfaceDeclaration } from 'ts-morph';
import type { JSONSchema4 } from 'json-schema';

export abstract class PropertyCompiler<$Property extends JSONSchema4> {
  abstract test(value: unknown): value is $Property;

  abstract compile(
    ctx: CompilerContext,
    iface: InterfaceDeclaration,
    key: string,
    value: $Property,
    required: boolean,
  ): void;
}
