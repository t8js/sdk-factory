import type {ResponseSchema} from './ResponseSchema';

export type ResponseShape<T extends ResponseSchema | undefined> =
    T extends undefined
        ? Omit<ResponseSchema, 'body'>
        // adding response properties not explicitly defined by the schema
        : T & Omit<ResponseSchema, keyof T | 'body'>;
