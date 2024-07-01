import type { AST } from 'json-schema-to-typescript/dist/src/types/AST.js';

export type RawSchemaLookup = Record<string, any>;

export type NamedAst<N extends AST = AST> = N & { standaloneName: string };

export type NodeMap = Map<string, NamedAst>;
