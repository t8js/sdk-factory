import type { APITarget } from "./APITarget.ts";
import type { SchemaEntry } from "./SchemaEntry.ts";

export type Schema<
  T extends Record<APITarget, SchemaEntry> = Record<APITarget, SchemaEntry>,
> = T;
