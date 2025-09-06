import type {RequestHandler} from './src/types/RequestHandler';
import type {Schema} from './src/types/Schema';
import {getRequestAction} from './src/utils/getRequestAction';
import {RequestError} from './src/RequestError';
import {RequestService} from './src/RequestService';

// https://en.wiktionary.org/w?search=test&fulltext=1
type WiktionarySchema = Schema<{
    'GET /w': {
        request: {
            query: {
                search: string;
                fulltext?: 0 | 1;
            };
        };
        response: {
            body: string;
        };
    };
    'GET /:section': {
        request: {
            params: {
                section: 'w' | 'none';
            };
            query: {
                search: string;
                fulltext?: 0 | 1;
            };
        };
        response: {
            body: string | null;
        };
    };
}>;

const endpoint = 'https://en.wiktionary.org';

let fetchText: RequestHandler = async (target, request) => {
    let {method, url} = getRequestAction({request, target, endpoint});

    let response = await fetch(url, {method});
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
            body: (await response.text()).substring(0, 1500) + '...',
        };
    }
    catch (error) {
        throw new RequestError(error);
    }
};

async function test(message: string, subject: () => void | Promise<void>) {
    console.log(message);
    await subject();
}

function assert(condition: boolean | undefined, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function equal(x: unknown, y: unknown) {
    return JSON.stringify(x) === JSON.stringify(y);
}

function toHTMLTitle(title: string) {
    return `<title>Search results for "${title}" - Wiktionary, the free dictionary</title>`;
}

(async () => {
    await test('getRequestAction() + `${HTTPMethod} ${path}` target', () => {
        let endpoint = 'https://w.cc/x';
        let target = 'GET /items/:id/:section';
        let request = {
            params: {
                id: 12,
                section: 'info',
            },
            query: {
                q: 'test',
            },
        };

        assert(equal(
            getRequestAction({request, target, endpoint}),
            {method: 'GET', url: 'https://w.cc/x/items/12/info?q=test'},
        ), 'getRequestAction() result');
    });

    await test('getRequestAction() + random target', () => {
        let endpoint = 'https://w.cc/x';
        let target = Math.random().toString(36).slice(2);
        let request = {
            method: 'GET',
            url: '/items/:id/:section',
            params: {
                id: 12,
                section: 'info',
            },
            query: {
                q: 'test',
            },
        };

        assert(equal(
            getRequestAction({request, target, endpoint}),
            {method: 'GET', url: 'https://w.cc/x/items/12/info?q=test'},
        ), 'getRequestAction() result');
    });

    await test('RequestService(url, handler) + getEntry()', async () => {
        let service = new RequestService<WiktionarySchema>(fetchText);

        let res1 = await service.send('GET /w', {
            query: {search: 'example', fulltext: 1},
        });

        assert(equal([res1.ok, res1.status, res1.statusText], [true, 200, 'OK']), 'send');
        assert(res1.body.includes(toHTMLTitle('example')), 'send title');

        let api = service.getEntry({search: 'GET /w'});

        let res2 = await api.search({
            query: {search: 'example', fulltext: 1},
        });

        assert(equal([res2.ok, res2.status, res2.statusText], [true, 200, 'OK']), 'api');
        assert(res2.body.includes(toHTMLTitle('example')), 'api title');
    });

    await test('url path params', async () => {
        let service = new RequestService<WiktionarySchema>();

        // alternative to the constructor parameter
        service.use(fetchText);

        let res1 = await service.send('GET /:section', {
            params: {section: 'w'},
            query: {search: 'example', fulltext: 1},
        });

        assert(equal([res1.ok, res1.status, res1.statusText], [true, 200, 'OK']), 'send');
        assert(res1.body?.includes(toHTMLTitle('example')), 'send title');

        let api = service.getEntry({fetchSection: 'GET /:section'});

        let res2 = await api.fetchSection({
            params: {section: 'w'},
            query: {search: 'example', fulltext: 1},
        });

        assert(equal([res2.ok, res2.status, res2.statusText], [true, 200, 'OK']), 'api');
        assert(res2.body?.includes(toHTMLTitle('example')), 'api title');
    });

    await test('code 404', async () => {
        let service = new RequestService<WiktionarySchema>(fetchText);

        try {
            await service.send('GET /:section', {
                params: {section: 'none'},
                query: {search: 'nonsense'},
            });
        }
        catch (error) {
            assert(error instanceof RequestError, 'send instanceof');

            if (error instanceof RequestError) {
                assert(equal([error.status, error.statusText], [404, 'Not Found']), 'send error');
                assert(error.message === '404 Not Found', 'send error message');
            }
        }

        let api = service.getEntry({fetchSection: 'GET /:section'});

        try {
            await api.fetchSection({
                params: {section: 'none'},
                query: {search: 'nonsense'},
            });
        }
        catch (error) {
            assert(error instanceof RequestError, 'api instanceof');

            if (error instanceof RequestError) {
                assert(equal([error.status, error.statusText], [404, 'Not Found']), 'api error');
                assert(error.message === '404 Not Found', 'api error message');
            }
        }
    });
})();
