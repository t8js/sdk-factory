import type { SchemaEntry } from "../SchemaEntry.ts";

export type PartialResponse<
  T extends SchemaEntry,
  K extends keyof Exclude<NonNullable<T["response"]>, void>,
> = Exclude<NonNullable<T["response"]>, void>[K];
