import type { APITarget } from "../APITarget.ts";
import type { RequestSchema } from "../RequestSchema.ts";

type RequestInitPolyfill = NonNullable<Parameters<typeof fetch>[1]>;

export type TransformInputParams = {
  target: APITarget;
  request: RequestSchema;
};

export type TransformInput = (
  params: TransformInputParams,
) => [string | URL, RequestInitPolyfill];
