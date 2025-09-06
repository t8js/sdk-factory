import type {SchemaEntry} from '../SchemaEntry';
import type {PartialRequest} from './PartialRequest';

export type ReqParams<T extends SchemaEntry> = PartialRequest<T, 'params'>;
