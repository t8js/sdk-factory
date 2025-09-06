import type {SchemaEntry} from '../SchemaEntry';

export type ReqShape<T extends SchemaEntry> = T['request'];
