/**
 * An API target is any string that identifies the request. This target
 * is passed to the custom request handler that matches the target to
 * the request.
 *
 * For the sake of convenience (but not necessarily), a target string of
 * an HTTP API can be '${HTTPMethod} ${path}'. Here, the path can contain
 * colon-prefixed parameters corresponding to the request's `params` keys.
 *
 * @example (HTTP API) `'GET /'`, `'POST /item'`, `'GET /item/:id'`, etc.
 */
export type APITarget = string;
