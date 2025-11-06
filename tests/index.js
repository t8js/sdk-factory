// node_modules/@t8/serve/dist/index.js
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { extname } from "node:path";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { build } from "esbuild";
import { join as join2 } from "node:path";
import { access, lstat } from "node:fs/promises";
async function bundle({ path = "", bundle: options } = {}) {
  if (!options) return;
  let normalizedOptions;
  if (typeof options === "boolean") normalizedOptions = {};
  else if (typeof options === "string")
    normalizedOptions = {
      input: options
    };
  else normalizedOptions = options;
  let dir = normalizedOptions.dir ?? "dist";
  let inputFile = join(path, normalizedOptions.input ?? "index.ts");
  let outputFile = join(path, dir, normalizedOptions.output ?? "index.js");
  await rm(join(path, dir), { recursive: true, force: true });
  await build({
    entryPoints: [inputFile],
    outfile: outputFile,
    bundle: true,
    platform: "browser",
    logLevel: "warning"
  });
}
async function isValidFilePath(filePath, dirPath) {
  if (!filePath.startsWith(dirPath)) return false;
  try {
    await access(filePath);
    return !(await lstat(filePath)).isDirectory();
  } catch {
    return false;
  }
}
var cwd = process.cwd();
async function getFilePath(url = "", { path = "", dirs = [], spa }) {
  let urlPath = url.replace(/[?#].*$/, "");
  for (let dir of dirs.length === 0 ? [""] : dirs) {
    let dirPath = join2(cwd, path, dir);
    let filePath = join2(dirPath, urlPath);
    if (!urlPath.endsWith("/") && await isValidFilePath(filePath, dirPath))
      return filePath;
    filePath = join2(dirPath, spa ? "" : urlPath, "index.html");
    if (await isValidFilePath(filePath, dirPath)) return filePath;
  }
}
var defaultHost = "localhost";
var defaultPort = 3e3;
function getTarget(config = {}) {
  let { host, port, url } = config;
  let [, , urlHost, , urlPort] = url?.match(/^(https?:\/\/)?([^:/]+)(:(\d+))?\/?/) ?? [];
  if (!urlPort && /^\d+$/.test(urlHost)) {
    urlPort = urlHost;
    urlHost = "";
  }
  return {
    port: port || Number(urlPort) || defaultPort,
    host: host || urlHost || defaultHost
  };
}
var mimeTypes = {
  html: "text/html; charset=utf-8",
  js: "text/javascript",
  json: "application/json",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  txt: "text/plain",
  md: "text/markdown"
};
async function serve(config = {}) {
  await bundle(config);
  return new Promise((resolve) => {
    let server = createServer(async (req, res) => {
      await config.onRequest?.(req, res);
      if (res.headersSent) return;
      let filePath = await getFilePath(req.url, config);
      if (filePath === void 0) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("Not found");
        return;
      }
      let ext = extname(filePath).slice(1).toLowerCase();
      let mimeType = mimeTypes[ext] ?? "application/octet-stream";
      res.writeHead(200, { "content-type": mimeType });
      createReadStream(filePath).pipe(res);
    });
    let { host, port } = getTarget(config);
    server.listen(port, host, () => {
      if (config.log) console.log(`Server running at http://${host}:${port}`);
      resolve(server);
    });
  });
}

// src/RequestError.ts
var DEFAULT_REQUEST_ERROR_NAME = "RequestError";
var DEFAULT_REQUEST_ERROR_MESSAGE = "Unspecified";
function getProp(x, key) {
  if (!x || typeof x !== "object" || !(key in x)) return void 0;
  return x[key];
}
var RequestError = class _RequestError extends Error {
  data;
  status;
  statusText;
  constructor(options) {
    let params = {
      status: getProp(options, "status"),
      statusText: getProp(options, "statusText"),
      message: getProp(options, "message"),
      name: getProp(options, "name"),
      data: getProp(options, "data")
    };
    let statusMessage = [params.status, params.statusText].filter(Boolean).join(" ");
    super(params.message || statusMessage || DEFAULT_REQUEST_ERROR_MESSAGE);
    this.name = params.name ?? DEFAULT_REQUEST_ERROR_NAME;
    this.status = Number(params.status ?? 0);
    this.statusText = String(params.statusText ?? "");
    this.data = params.data;
    Object.setPrototypeOf(this, _RequestError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _RequestError);
    }
  }
};

// src/RequestService.ts
var RequestService = class {
  handler;
  /**
   * Accepts a request handler as a parameter, which might be
   * highly dependent on particular use cases and the environment.
   */
  constructor(handler) {
    this.handler = handler;
  }
  /**
   * Sends a request to the `target` specified in the
   * `RequestService`'s schema.
   */
  send(target, request) {
    if (!this.handler) throw new Error("Missing request handler");
    return this.handler(target, request);
  }
  /**
   * Sets the request handler.
   */
  use(handler) {
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
  getEntry(aliasMap) {
    let api = {};
    for (let [methodName, target] of Object.entries(aliasMap))
      api[methodName] = (request) => {
        return this.send(target, request);
      };
    return api;
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
  getQueryEntry(aliasMap) {
    let api = {};
    for (let [methodName, target] of Object.entries(aliasMap))
      api[methodName] = (query) => {
        return this.send(target, { query });
      };
    return api;
  }
};

// src/lib/escapeRegExp.ts
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/lib/isAbsoluteURL.ts
function isAbsoluteURL(x) {
  return typeof x === "string" && /^(\w+:)?\/\//.test(x);
}

// src/utils/getRequestAction.ts
var syntheticBase = "https://0.cc";
function getRequestAction({
  request,
  target,
  endpoint: endpoint2
}) {
  let method = request?.method;
  let url = request?.url ?? request?.path;
  if (target && /^[A-Z]+\s/.test(target)) {
    let [targetMethod, targetLocation] = target.split(/\s+/);
    if (!method) method = targetMethod;
    if (!url) url = targetLocation;
  }
  let urlObject;
  let hasAbsoluteURL = isAbsoluteURL(url);
  if (url && hasAbsoluteURL) urlObject = new URL(url);
  else {
    urlObject = new URL(endpoint2, syntheticBase);
    hasAbsoluteURL = isAbsoluteURL(endpoint2);
    if (url) {
      let path = urlObject.pathname;
      if (!path) urlObject.pathname = url;
      if (path.endsWith("/")) path = path.slice(0, -1);
      if (url.startsWith("/")) url = url.slice(1);
      urlObject.pathname = `${path}/${url}`;
    }
  }
  let query = request?.query;
  let params = request?.params;
  if (query) {
    for (let [key, value] of Object.entries(query)) {
      if (value !== null && value !== void 0)
        urlObject.searchParams.append(key, String(value));
    }
  }
  if (params) {
    for (let [key, value] of Object.entries(params)) {
      if (value !== null && value !== void 0)
        urlObject.pathname = urlObject.pathname.replace(
          new RegExp(`:${escapeRegExp(key)}\\b`, "g"),
          String(value)
        );
    }
  }
  let { href, pathname, search, hash } = urlObject;
  return {
    method,
    url: hasAbsoluteURL ? href : pathname + search + hash
  };
}

// tests/index.ts
var endpoint = "http://localhost:3000";
var fetchText = async (target, request) => {
  let { method, url } = getRequestAction({ request, target, endpoint });
  let response = await fetch(url, { method });
  let { ok, status, statusText } = response;
  if (!ok) {
    throw new RequestError({
      status,
      statusText
    });
  }
  try {
    return {
      ok,
      status,
      statusText,
      body: `${(await response.text()).substring(0, 1500)}...`
    };
  } catch (error) {
    throw new RequestError(error);
  }
};
async function test(message, subject) {
  console.log(message);
  await subject();
}
function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}
function equal(x, y) {
  return JSON.stringify(x) === JSON.stringify(y);
}
function toHTMLTitle(title) {
  return `<title>Search results for "${title}" - Wiktionary, the free dictionary</title>`;
}
(async () => {
  let server = await serve({
    path: "tests"
  });
  await test("getRequestAction() + 'HTTPMethod path' target", () => {
    let endpoint2 = "https://w.cc/x";
    let target = "GET /items/:id/:section";
    let request = {
      params: {
        id: 12,
        section: "info"
      },
      query: {
        q: "test"
      }
    };
    assert(
      equal(getRequestAction({ request, target, endpoint: endpoint2 }), {
        method: "GET",
        url: "https://w.cc/x/items/12/info?q=test"
      }),
      "getRequestAction() result"
    );
  });
  await test("getRequestAction() + random target", () => {
    let endpoint2 = "https://w.cc/x";
    let target = Math.random().toString(36).slice(2);
    let request = {
      method: "GET",
      url: "/items/:id/:section",
      params: {
        id: 12,
        section: "info"
      },
      query: {
        q: "test"
      }
    };
    assert(
      equal(getRequestAction({ request, target, endpoint: endpoint2 }), {
        method: "GET",
        url: "https://w.cc/x/items/12/info?q=test"
      }),
      "getRequestAction() result"
    );
  });
  await test("RequestService(url, handler) + getEntry()", async () => {
    let service = new RequestService(fetchText);
    let res1 = await service.send("GET /w", {
      query: { search: "example", fulltext: 1 }
    });
    assert(
      equal([res1.ok, res1.status, res1.statusText], [true, 200, "OK"]),
      "send"
    );
    assert(res1.body.includes(toHTMLTitle("example")), "send title");
    let api = service.getEntry({ search: "GET /w" });
    let res2 = await api.search({
      query: { search: "example", fulltext: 1 }
    });
    assert(
      equal([res2.ok, res2.status, res2.statusText], [true, 200, "OK"]),
      "api"
    );
    assert(res2.body.includes(toHTMLTitle("example")), "api title");
  });
  await test("url path params", async () => {
    let service = new RequestService();
    service.use(fetchText);
    let res1 = await service.send("GET /:section", {
      params: { section: "w" },
      query: { search: "example", fulltext: 1 }
    });
    assert(
      equal([res1.ok, res1.status, res1.statusText], [true, 200, "OK"]),
      "send"
    );
    assert(res1.body?.includes(toHTMLTitle("example")), "send title");
    let api = service.getEntry({ fetchSection: "GET /:section" });
    let res2 = await api.fetchSection({
      params: { section: "w" },
      query: { search: "example", fulltext: 1 }
    });
    assert(
      equal([res2.ok, res2.status, res2.statusText], [true, 200, "OK"]),
      "api"
    );
    assert(res2.body?.includes(toHTMLTitle("example")), "api title");
  });
  await test("code 404", async () => {
    let service = new RequestService(fetchText);
    try {
      await service.send("GET /:section", {
        params: { section: "none" },
        query: { search: "nonsense" }
      });
    } catch (error) {
      assert(error instanceof RequestError, "send instanceof");
      if (error instanceof RequestError) {
        assert(
          equal([error.status, error.statusText], [404, "Not Found"]),
          "send error"
        );
        assert(error.message === "404 Not Found", "send error message");
      }
    }
    let api = service.getEntry({ fetchSection: "GET /:section" });
    try {
      await api.fetchSection({
        params: { section: "none" },
        query: { search: "nonsense" }
      });
    } catch (error) {
      assert(error instanceof RequestError, "api instanceof");
      if (error instanceof RequestError) {
        assert(
          equal([error.status, error.statusText], [404, "Not Found"]),
          "api error"
        );
        assert(error.message === "404 Not Found", "api error message");
      }
    }
  });
  server.close();
})();
