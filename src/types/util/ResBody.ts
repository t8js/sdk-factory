import type {SchemaEntry} from '../SchemaEntry';
import type {PartialResponse} from './PartialResponse';

export type ResBody<T extends SchemaEntry> = PartialResponse<T, 'body'>;
