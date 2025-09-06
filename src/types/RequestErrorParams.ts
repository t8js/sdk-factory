export type RequestErrorParams<T = unknown> = {
    name?: string;
    message?: string;
    status?: number;
    statusText?: string;
    data?: T;
};
