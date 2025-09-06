import type {RequestSchema} from './RequestSchema';
import type {ResponseSchema} from './ResponseSchema';

export type SchemaEntryShape = {
    request?: RequestSchema;
    response?: ResponseSchema;
};
