import { createValueSerializer } from "@kavsingh/electron-typed-ipc/main";

// Date Serializer Pattern
export const dateSerializer = createValueSerializer({
isDeserialized: (value): value is Date => value instanceof Date,
isSerialized: (value): value is string =>
typeof value === "string" && !isNaN(Date.parse(value)),
serialize: (value) => value.toISOString(),
deserialize: (value) => new Date(value),
});

// Usage:
// const serializer = createSerializer([dateSerializer]);
// const disposeIpc = createIpcMain(definition, { serializer });
