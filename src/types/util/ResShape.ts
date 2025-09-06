import type {ResponseShape} from '../ResponseShape';
import type {SchemaEntry} from '../SchemaEntry';

export type ResShape<T extends SchemaEntry> = ResponseShape<T['response']>;
