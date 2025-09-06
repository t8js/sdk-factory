import type {Schema} from './Schema';

export type AliasMap<S extends Schema> = Record<string, keyof S>;
