import type { SchemaEntry } from "../SchemaEntry.ts";
import type { PartialRequest } from "./PartialRequest.ts";

export type ReqParams<T extends SchemaEntry> = PartialRequest<T, "params">;
