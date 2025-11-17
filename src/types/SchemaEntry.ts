import type { SchemaEntryShape } from "./SchemaEntryShape.ts";

export type SchemaEntry<T extends SchemaEntryShape = SchemaEntryShape> = T;
