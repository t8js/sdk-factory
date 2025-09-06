import type {SchemaEntry} from '../SchemaEntry';
import type {PartialRequest} from './PartialRequest';

export type ReqQuery<T extends SchemaEntry> = PartialRequest<T, 'query'>;
