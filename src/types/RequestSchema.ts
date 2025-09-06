import type {APITarget} from './APITarget';

export type RequestSchema = void | {
    target?: APITarget;
    method?: string;
    url?: string;
    path?: string;
    /**
     * URL path parameters
     * @example
     * `service.send('GET /item/:id', {params: {id: 10}});`
     * sends `GET /item/10`
     */
    params?: void | Record<string, unknown>;
    query?: void | Record<string, unknown>;
    headers?: void | Record<string, unknown>;
    body?: unknown;
};
