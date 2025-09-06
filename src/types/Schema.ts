import type {APITarget} from './APITarget';
import type {SchemaEntry} from './SchemaEntry';

export type Schema<T extends Record<APITarget, SchemaEntry> = Record<APITarget, SchemaEntry>> = T;
