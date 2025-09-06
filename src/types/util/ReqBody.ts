import type {SchemaEntry} from '../SchemaEntry';
import type {PartialRequest} from './PartialRequest';

export type ReqBody<T extends SchemaEntry> = PartialRequest<T, 'body'>;
