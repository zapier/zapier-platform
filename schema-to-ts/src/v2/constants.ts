import type { TypeParameterDeclarationStructure } from 'ts-morph';

export const INPUT_FIELDS_TYPE_ARG = {
  name: '$InputFields',
  constraint: 'DynamicInputFields',
  default: 'never',
} as const;
