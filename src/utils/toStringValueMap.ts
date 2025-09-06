export function toStringValueMap(
    map: Record<string, unknown> | void | undefined,
): Record<string, string> | undefined {
    if (!map)
        return;

    let stringValueMap: Record<string, string> = {};

    for (let [key, value] of Object.entries(map)) {
        if (value !== undefined && value !== null)
            stringValueMap[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    return stringValueMap;
}
