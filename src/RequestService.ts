import type {AliasMap} from './types/AliasMap';
import type {APITarget} from './types/APITarget';
import type {RequestHandler} from './types/RequestHandler';
import type {RequestSchema} from './types/RequestSchema';
import type {ResponseShape} from './types/ResponseShape';
import type {Schema} from './types/Schema';

export class RequestService<S extends Schema> {
    handler: RequestHandler | undefined;

    /**
     * Accepts a request handler as a parameter, which might be
     * highly dependent on particular use cases and the environment.
     */
    constructor(handler?: RequestHandler) {
        this.handler = handler;
    }

    /**
     * Sends a request to the `target` specified in the
     * `RequestService`'s schema.
     */
    send<T extends keyof S>(
        target: T,
        request: S[T]['request'],
    ) {
        if (!this.handler)
            throw new Error('Missing request handler');

        return this.handler(
            target as APITarget,
            request!,
        ) as Promise<ResponseShape<S[T]['response']>>;
    }

    /**
     * Sets the request handler.
     */
    use(handler: RequestHandler): void {
        this.handler = handler;
    }

    /**
     * Returns a map of aliases to the schema methods.
     *
     * @example
     * ```
     * let service = new RequestService<CustomSchema>(handler);
     * let api = service.getEntry({
     *     getItem: 'GET /items/:id',
     * });
     *
     * service.send('GET /items/:id', {
     *     params: {id: 1},
     * });
     * // the above call is now equivalent to:
     * api.getItem({params: {id: 1}});
     * ```
     */
    getEntry<T extends AliasMap<S>>(aliasMap: T) {
        let api: Record<string, unknown> = {};

        for (let [methodName, target] of Object.entries(aliasMap))
            api[methodName] = (request: RequestSchema) => {
                return this.send(target, request);
            };

        return api as {
            [K in keyof T]: (
                options: S[T[K]]['request'],
            ) => Promise<ResponseShape<S[T[K]]['response']>>;
        };
    }

    /**
     * Similar to `.getEntry()`, with the returned aliases accepting
     * only the query part of the request schema.
     *
     * This is a shorthand option for API methods fully controlled by
     * query parameters.
     *
     * @example
     * ```
     * let api = service.getEntry({
     *     getItem: 'GET /item',
     * });
     * api.getItem({
     *     query: {id: 1},
     * });
     * ```
     *
     * This is equivalent to:
     *
     * ```
     * let api = service.getQueryEntry({
     *     getItem: 'GET /item',
     * });
     * api.getItem({id: 1});
     * ```
     *
     * With the latter code, there is no need to nest the request
     * options into the `query` key, which might seem redundant for
     * API methods controlled only with query parameters.
     */
    getQueryEntry<T extends AliasMap<S>>(aliasMap: T) {
        let api: Record<string, unknown> = {};

        for (let [methodName, target] of Object.entries(aliasMap))
            api[methodName] = (query: Exclude<RequestSchema, void>['query']) => {
                return this.send(target, {query});
            };

        return api as {
            [K in keyof T]: (
                options: S[T[K]]['request'] extends void
                    ? void
                    : Exclude<S[T[K]]['request'], void>['query'],
            ) => Promise<ResponseShape<S[T[K]]['response']>>;
        };
    }
}
