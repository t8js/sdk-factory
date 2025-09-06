import type {SchemaEntry} from '../SchemaEntry';

export type PartialRequest<
    T extends SchemaEntry,
    K extends keyof Exclude<NonNullable<T['request']>, void>
> = Exclude<NonNullable<T['request']>, void>[K];
