[![npm](https://flat.badgen.net/npm/v/@t8/sdk-factory?labelColor=345&color=46e)](https://www.npmjs.com/package/@t8/sdk-factory) ![Lightweight](https://flat.badgen.net/bundlephobia/minzip/@t8/sdk-factory/?label=minzip&labelColor=345&color=46e) ![TypeScript ✓](https://flat.badgen.net/badge/TypeScript/✓?labelColor=345&color=345)

# @t8/sdk-factory

*Typed SDK factory for web APIs*

- Type-safe request handler based on a custom API schema
- Shared interface for handling API requests on the client and the server
- No internal dependence on a specific request utility

Installation: `npm i @t8/sdk-factory`

## `RequestService`

The `RequestService` class helps create a type-safe entrypoint to an API:

```ts
import {RequestService} from '@t8/sdk-factory';

let service = new RequestService<APISchema>(fetchData);
```

The constructor accepts a custom request handler `fetchData`. A specific request handler isn't built into the package, since it can vary in many ways depending on the purpose and environment of the application (it might make use of `fetch`, `node-fetch`, `axios`, logging, default headers, or whatever necessary).

The purpose of `RequestService` is to offer a consistent environment-agnostic interface to request handling on top of a typed API schema.

🔹 A typed schema allows to prevalidate request inputs at compile-time and highlight mismatches in a type-aware IDE.

🔹 The environment-agnostic interface works consistently throughout the client and the server:

```ts
let browserClient = new RequestService<APISchema>(clientHandler);
```

```ts
let serverClient = new RequestService<APISchema>(serverHandler);
```

Same API schema, same request interface, same reusable related code, different environment-specific request handlers.

## Schema definition

The `APISchema` type used with the [`RequestService`](#requestservice) constructor is a custom schema outlining the types of requests and responses within an API. The example below shows what such a schema may look like.

```ts
import type {Schema} from '@t8/sdk-factory';

// wrapping into the `Schema` generic type is optional, but
// this helps validate the basic schema structure
export type APISchema = Schema<{
    // a schema key can be any unique string, for an HTTP API
    // a pair of a method and a path can serve this purpose
    'GET /items/:id': {
        request: {
            // `params` can be omitted if the URL path is fixed and
            // has no parameter placeholders
            params: {
                id: number;
            };
            query?: {
                mode?: 'compact' | 'full';
            };
        };
        response: {
            body: {
                id: number;
                name?: string;
            };
        };
    };
    'POST /items/:id': {
        // ...
    };
    'GET /items': {
        // ...
    };
    // ... and so forth
}>;
```

With such a schema assigned to `service`, calls to its `send()` method will be prevalidated against this schema, which means that a type-aware IDE will warn of type mismatches or typos in the parameters:

```ts
let {ok, status, body} = await service.send('GET /items/:id', {
    params: {
        id: 10,
    },
    query: {
        mode: 'full',
    },
});
```

The options passed as the second parameter to `send()` are validated as `APISchema['GET /items/:id']` based on the schema type passed to the `RequestService` constructor and the first parameter passed to `send()`.

## Shorthand methods

The API schema keys can be mapped to custom method names:

```ts
let api = service.getEntry({
    getItems: 'GET /items',
    getItem: 'GET /items/:id',
    setItem: 'POST /items/:id',
});
```

With such a mapping in place, `service.send('GET /items/:id', {...})` has another equivalent form:

```ts
let response = await api.getItem({
    params: {
        id: 10,
    },
    query: {
        mode: 'full',
    },
});
```

The `getEntry()` method doesn't have to take all the API schema keys at once. The API methods can be split into logical scopes:

```ts
let api = {
    users: service.getEntry({
        getList: 'GET /users',
        getInfo: 'GET /users/:id',
    }),
    items: service.getEntry({
        getList: 'GET /items',
        getInfo: 'GET /items/:id',
        setInfo: 'POST /items/:id',
    }),
};

let userList = await api.users.getList();
let firstUser = await api.users.getInfo({params: {id: userList[0].id}});
```

For API methods controlled only with query parameters, there is also a shorthand option: the `getQueryEntry()` method, returning aliases accepting only query parameters, without the need to nest them into the `query` key.

## Custom request handler

As shown above, the `RequestService` constructor takes a custom request handler as a parameter. Internal independence of `RequestService` from a fixed built-in request handler allows to handle requests of all sorts and environments (the browser or node) without locking in with a certain approach to handling requests.

Here's an example of a basic JSON request handler that can be passed to `RequestService`:

```ts
import {
    RequestHandler,
    RequestError,
    getRequestAction,
    toStringValueMap,
} from '@t8/sdk-factory';

const endpoint = 'https://api.example.com';

export const fetchJSON: RequestHandler = async (target, request) => {
    let {method, url} = getRequestAction({request, target, endpoint});

    let response = await fetch(url, {
        method,
        headers: toStringValueMap(request?.headers),
        body: request?.body ? JSON.stringify(request?.body) : null,
    });

    let {ok, status, statusText} = response;

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
}
```

To meet the needs of a specific use case, the request handler's code can certainly depart from the example above (which is again the reason why it's not hardwired into the package).
