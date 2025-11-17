import type { SchemaEntry } from "../SchemaEntry.ts";

export type ReqShape<T extends SchemaEntry> = T["request"];
