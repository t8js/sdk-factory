import type { SchemaEntry } from "../SchemaEntry.ts";
import type { PartialRequest } from "./PartialRequest.ts";

export type ReqBody<T extends SchemaEntry> = PartialRequest<T, "body">;
