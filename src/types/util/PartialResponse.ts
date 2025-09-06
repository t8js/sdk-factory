import type {SchemaEntry} from '../SchemaEntry';

export type PartialResponse<
    T extends SchemaEntry,
    K extends keyof Exclude<NonNullable<T['response']>, void>
> = Exclude<NonNullable<T['response']>, void>[K];
