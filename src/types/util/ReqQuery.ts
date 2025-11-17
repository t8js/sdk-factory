import type { SchemaEntry } from "../SchemaEntry.ts";
import type { PartialRequest } from "./PartialRequest.ts";

export type ReqQuery<T extends SchemaEntry> = PartialRequest<T, "query">;
