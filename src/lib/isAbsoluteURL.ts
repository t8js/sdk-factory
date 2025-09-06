export function isAbsoluteURL(x: unknown): boolean {
    return typeof x === 'string' && /^(\w+:)?\/\//.test(x);
}
