import type { ResponseShape } from "../ResponseShape.ts";
import type { SchemaEntry } from "../SchemaEntry.ts";

export type ResShape<T extends SchemaEntry> = ResponseShape<T["response"]>;
