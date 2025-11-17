import type { Schema } from "./Schema.ts";

export type AliasMap<S extends Schema> = Record<string, keyof S>;
