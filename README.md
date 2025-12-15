# T8 SDK Factory

Typed SDK factory for web APIs

[![npm](https://img.shields.io/npm/v/@t8/sdk-factory?labelColor=345&color=46e)](https://www.npmjs.com/package/@t8/sdk-factory) ![Lightweight](https://img.shields.io/bundlephobia/minzip/@t8/sdk-factory?label=minzip&labelColor=345&color=46e)

- Typed requests based on custom API schemas
- Environment-agnostic interface
- Zero dependencies

Installation: `npm i @t8/sdk-factory`

## `RequestService`

The `RequestService` class helps create a thin type-safe entrypoint to an API:

```ts
import { RequestService } from "@t8/sdk-factory";

let service = new RequestService<APISchema>(requestHandler);
```

The constructor accepts a custom `requestHandler`. A specific request handler isn't built into the package, since it can vary in many ways depending on the purpose and environment of the application: it can make use of `fetch`, `axios`, logging, default headers, or whatever necessary.

The purpose of `RequestService` is to offer a single environment-agnostic interface to request handling on top of a typed API schema.

⬥ A typed schema allows to prevalidate request inputs at compile-time and highlight mismatches in a type-aware IDE.

⬥ The environment-agnostic interface works consistently throughout the client and the server:

```ts
let service = new RequestService<APISchema>(browserHandler);
```

```ts
let service = new RequestService<APISchema>(serverHandler);
```

The same API with different environment-specific request handlers under the hood results in reusable isomorphic code:

```ts
// browser or server
let { ok, status, body } = await service.send("GET /items");
```

## Schema definition

The `APISchema` type used with the [`RequestService`](#requestservice) constructor is a custom schema outlining the types of requests and responses within an API. The example below shows what such a schema may look like.

```ts
import type { Schema } from "@t8/sdk-factory";

// wrapping into the `Schema` generic type is optional, but
// this helps validate the basic schema structure
export type APISchema = Schema<{
  // a schema key can be any unique string, for an HTTP API
  // a pair of a method and a path can serve this purpose
  "GET /items/:id": {
    request: {
      // `params` can be omitted if the URL path is fixed and
      // has no parameter placeholders
      params: {
        id: number;
      };
      query?: {
        mode?: "compact" | "full";
      };
    };
    response: {
      body: {
        id: number;
        name?: string;
      };
    };
  };
  "POST /items/:id": {
    // ...
  };
  "GET /items": {
    // ...
  };
  // ... and so forth
}>;
```

With such a schema assigned to `service`, calls to its `send()` method will be prevalidated against this schema, which means that a type-aware IDE will warn of type mismatches or typos in the parameters:

```ts
let { ok, status, body } = await service.send("GET /items/:id", {
  params: {
    id: 10,
  },
  query: {
    mode: "full",
  },
});
```

The options passed as the second parameter to `send()` are validated as `APISchema["GET /items/:id"]` based on the schema type passed to the `RequestService` constructor and the first parameter passed to `send()`.

## Shorthand methods

The API schema keys can be mapped to custom method names:

```ts
let api = service.getEntry({
  getItems: "GET /items",
  getItem: "GET /items/:id",
  setItem: "POST /items/:id",
});
```

With such a mapping in place, `service.send("GET /items/:id", { ... })` has another equivalent form:

```ts
let response = await api.getItem({
  params: {
    id: 10,
  },
  query: {
    mode: "full",
  },
});
```

The `getEntry()` method doesn't have to take all the API schema keys at once. The API methods can be split into logical scopes:

```ts
let api = {
  users: service.getEntry({
    getList: "GET /users",
    getInfo: "GET /users/:id",
  }),
  items: service.getEntry({
    getList: "GET /items",
    getInfo: "GET /items/:id",
    setInfo: "POST /items/:id",
  }),
};

let userList = await api.users.getList();
let firstUser = await api.users.getInfo({ params: { id: userList[0].id } });
```

For API methods controlled only with query parameters, there is also a shorthand option: the `getQueryEntry()` method, returning aliases accepting only query parameters, without the need to nest them into the `query` key.

## Custom request handler

As shown above, the `RequestService` constructor takes a custom request handler as a parameter. Internal independence of `RequestService` from a fixed built-in request handler allows to handle requests of all sorts and environments (the browser or node) without locking in with a certain approach to handling requests.

Here's an example of a basic JSON request handler that can be passed to `RequestService`:

```ts
import {
  RequestHandler,
  RequestError,
  RequestService,
  getRequestAction,
  toStringValueMap,
} from "@t8/sdk-factory";
import type { APISchema } from "./APISchema";

const getRequestHandler(endpoint: string): RequestHandler {
  return function(target, request) {
    let { method, url } = getRequestAction({ request, target, endpoint });

    let response = await fetch(url, {
      method,
      headers: toStringValueMap(request?.headers),
      body: request?.body ? JSON.stringify(request?.body) : null,
    });

    let { ok, status, statusText } = response;

    if (!ok) {
      throw new RequestError({
        status,
        statusText,
      });
    }

    try {
      return {
        ok,
        status,
        statusText,
        body: await response.json(),
      };
    }
    catch (error) {
      throw new RequestError(error);
    }
  };
}

export const serverService = new RequestService<APISchema>(
  getRequestHandler("https://api.example.com")
);

// Assuming that the given API is proxied by the server to
// the browser via `/api`
export const browserService = new RequestService<APISchema>(
  getRequestHandler("/api")
);
```

To meet the needs of a specific use case, the request handler's code can certainly depart from the example above (which is the primary reason why it's not hardwired into the package).

## Schema-based validation

Fine-grained schema-based validation of the request and response can be implemented with a custom request handler. Here's how the basic JSON request handler from the [previous section](#custom-request-handler) can be modified to validate its input and output with Zod or, similarly, with another validation lib:

```diff
  import {
    RequestHandler,
    RequestError,
    RequestService,
    getRequestAction,
    toStringValueMap,
  } from "@t8/sdk-factory";
- import type { APISchema } from "./APISchema";
+ import { apiSchema, type APISchema } from "./apiSchema"; // defined with Zod

  function getRequestHandler(endpoint: string): RequestHandler {
    return function(target, request) {
+     try {
+       schema[target]?.request?.parse(request);
+     }
+     catch {
+       throw new RequestError({
+         statusText: "Invalid request data",
+       });
+     }

      let { method, url } = getRequestAction({ request, target, endpoint });

      let response = await fetch(url, {
        method,
        headers: toStringValueMap(request?.headers),
        body: request?.body ? JSON.stringify(request?.body) : null,
      });

      let { ok, status, statusText } = response;

      if (!ok) {
        throw new RequestError({
          status,
          statusText,
        });
      }

      try {
        let body = await response.json();

+       try {
+         schema[target]?.response?.parse(body);
+       }
+       catch {
+         throw new RequestError({
+           statusText: "Invalid response data",
+         });
+       }

        return {
          ok,
          status,
          statusText,
          body,
        };
      }
      catch (error) {
        throw new RequestError(error);
      }
    };
  }

  export const serverService = new RequestService<APISchema>(
    getRequestHandler("https://api.example.com")
  );

  // Assuming that the given API is proxied by the server to
  // the browser via `/api`
  export const browserService = new RequestService<APISchema>(
    getRequestHandler("/api")
  );
```

Here's an example of what the API schema definition with a validation library may look like:

```ts
import { z } from "zod";

export const apiSchema = {
  "GET /items/:id": {
    request: z.object({
      params: z.object({
        id: z.coerce.number(),
      }),
      query: z.optional(
        z.object({
          mode: z.optional(z.string()),
        })
      ),
    }),
    response: z.object({
      id: z.coerce.number(),
      name: z.optional(z.string()),
    }),
  },
};

export type APISchema = {
  [K1 in keyof typeof apiSchema]: {
    [K2 in keyof (typeof apiSchema)[K1]]: z.infer<(typeof apiSchema)[K1][K2]>;
  };
};
```
