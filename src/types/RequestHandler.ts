import type {APITarget} from './APITarget';
import type {RequestSchema} from './RequestSchema';
import type {ResponseSchema} from './ResponseSchema';

export type RequestHandler = (
    target: APITarget,
    request: RequestSchema,
) => Promise<ResponseSchema>;
