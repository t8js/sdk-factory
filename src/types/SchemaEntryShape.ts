import type { RequestSchema } from "./RequestSchema.ts";
import type { ResponseSchema } from "./ResponseSchema.ts";

export type SchemaEntryShape = {
  request?: RequestSchema;
  response?: ResponseSchema;
};
