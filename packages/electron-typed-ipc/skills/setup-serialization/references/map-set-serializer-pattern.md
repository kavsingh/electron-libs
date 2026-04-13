import { createValueSerializer } from "@kavsingh/electron-typed-ipc/main";

// Map Serializer Pattern
export const mapSerializer = createValueSerializer({
isDeserialized: (value): value is Map<any, any> => value instanceof Map,
isSerialized: (value): value is Array<[any, any]> => Array.isArray(value),
serialize: (value) => Array.from(value.entries()),
deserialize: (value) => new Map(value),
});

// Set Serializer Pattern
export const setSerializer = createValueSerializer({
isDeserialized: (value): value is Set<any> => value instanceof Set,
isSerialized: (value): value is any[] => Array.isArray(value),
serialize: (value) => Array.from(value),
deserialize: (value) => new Set(value),
});

// Usage:
// const serializer = createSerializer([mapSerializer, setSerializer]);
// const disposeIpc = createIpcMain(definition, { serializer });
