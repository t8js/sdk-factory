export type ResponseSchema = {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: Record<string, unknown>;
    body?: unknown;
};
