import type { SchemaEntry } from "../SchemaEntry.ts";
import type { PartialResponse } from "./PartialResponse.ts";

export type ResBody<T extends SchemaEntry> = PartialResponse<T, "body">;
