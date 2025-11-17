import type { APITarget } from "./APITarget.ts";
import type { RequestSchema } from "./RequestSchema.ts";
import type { ResponseSchema } from "./ResponseSchema.ts";

export type RequestHandler = (
  target: APITarget,
  request: RequestSchema,
) => Promise<ResponseSchema>;
