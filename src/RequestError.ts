import {RequestErrorParams} from './types/RequestErrorParams';

export const DEFAULT_REQUEST_ERROR_NAME = 'RequestError';
export const DEFAULT_REQUEST_ERROR_MESSAGE = 'Unspecified';

function getProp<T, K extends keyof RequestErrorParams<T>>(
    x: unknown,
    key: K,
) {
    if (!x || typeof x !== 'object' || !(key in x))
        return undefined;
    return x[key as keyof typeof x] as RequestErrorParams<T>[K];
}

export class RequestError<T = unknown> extends Error {
    data: T | undefined;
    status: number;
    statusText: string;

    constructor(options?: unknown) {
        let params: Partial<RequestErrorParams<T>> = {
            status: getProp<T, 'status'>(options, 'status'),
            statusText: getProp<T, 'statusText'>(options, 'statusText'),
            message: getProp<T, 'message'>(options, 'message'),
            name: getProp<T, 'name'>(options, 'name'),
            data: getProp<T, 'data'>(options, 'data'),
        };

        let statusMessage = [params.status, params.statusText]
            .filter(Boolean)
            .join(' ');

        super(params.message || statusMessage || DEFAULT_REQUEST_ERROR_MESSAGE);
        this.name = params.name ?? DEFAULT_REQUEST_ERROR_NAME;

        this.status = Number(params.status ?? 0);
        this.statusText = String(params.statusText ?? '');
        this.data = params.data;

        // @see https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, RequestError.prototype);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RequestError);
        }
    }
}
