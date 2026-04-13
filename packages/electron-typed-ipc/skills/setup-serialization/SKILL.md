---
name: setup-serialization
description: >
  Custom serializers for Date, Map, Set, custom classes; createSerializer composition; serializer predicate order; structured clone limitations
type: core
library: electron-typed-ipc
library_version: "1.0.0-dev.0"
sources:
  - "kavsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts"
---

# Setting Up Custom Serialization

electron-typed-ipc uses Electron's structured clone algorithm for default serialization. This handles most primitives but loses custom types like Date, Map, Set, and class instances. Custom serializers round-trip complex types correctly.

## Setup

Define custom serializers and pass them to `createIpcMain` and `createIpcRenderer`:

```typescript
import {
	createIpcMain,
	createSerializer,
	createValueSerializer,
} from "@kavsingh/electron-typed-ipc/main";
import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

// Define a custom serializer for Date
const dateSerializer = createValueSerializer({
	isDeserialized: (value): value is Date => value instanceof Date,
	isSerialized: (value): value is string =>
		typeof value === "string" && !isNaN(Date.parse(value)),
	serialize: (value) => value.toISOString(),
	deserialize: (value) => new Date(value),
});

// Compose multiple serializers
const serializer = createSerializer([dateSerializer]);

// Main process
const disposeIpc = createIpcMain(ipcDefinition, { serializer });

// Renderer process — use same serializer
const tipc = createIpcRenderer<AppIpcDefinitions>({ serializer });

app.on("quit", disposeIpc);
```

## Core Patterns

**Serialize Date objects**

See [references/date-serializer-pattern.md](references/date-serializer-pattern.md) for a complete Date serializer implementation.

**Serialize Map and Set**

Convert to arrays during serialization:

```typescript
const mapSerializer = createValueSerializer({
	isDeserialized: (value): value is Map<any, any> => value instanceof Map,
	isSerialized: (value): value is Array<[any, any]> => Array.isArray(value),
	serialize: (value) => Array.from(value.entries()),
	deserialize: (value) => new Map(value),
});

const setSerializer = createValueSerializer({
	isDeserialized: (value): value is Set<any> => value instanceof Set,
	isSerialized: (value): value is any[] => Array.isArray(value),
	serialize: (value) => Array.from(value),
	deserialize: (value) => new Set(value),
});

const serializer = createSerializer([
	dateSerializer,
	mapSerializer,
	setSerializer,
]);
```

**Serialize custom class instances**

Plain objects preserve properties but lose methods. Extract properties for transport:

```typescript
class User {
	constructor(
		public id: string,
		public name: string,
	) {}
	getDisplayName() {
		return `${this.name} (#${this.id})`;
	}
}

// Instead of trying to serialize the class instance:
mutation<User, string>((event, input) => {
	return new User("123", "Alice"); // ✗ Methods lost in renderer
});

// Extract to plain object:
mutation<{ id: string; name: string }, string>((event, input) => {
	const user = new User("123", "Alice");
	return { id: user.id, name: user.name }; // ✓ Works
});

// Reconstruct in renderer if needed:
const response = await tipc.getUser.query();
const user = Object.assign(Object.create(User.prototype), response);
```

**Composition order matters**

Serializers are checked in order; the first matching predicate wins:

```typescript
// WRONG: Broad predicate matches first
const serializers = [
	{
		isDeserialized: (v) => typeof v === "object", // Too broad!
		// ... rest of serializer
	},
	dateSerializer, // Never reached — object predicate matched first
];

// RIGHT: Specific predicates first
const serializers = [
	dateSerializer,
	mapSerializer,
	setSerializer,
	// Generic object handler last (if needed)
];
```

**Handle arrays recursively**

Serializers automatically traverse arrays. Define the element type:

```typescript
mutation<Date[], undefined>((event) => [
	new Date("2025-01-01"),
	new Date("2025-12-31"),
]);
// With dateSerializer, both dates round-trip correctly
```

## Common Mistakes

### HIGH Sending Date objects expecting native round-trip

Wrong:

```typescript
// No custom serializer
const disposeIpc = createIpcMain(definition);

query<Date, undefined>((event) => {
	return new Date(); // Sent as ISO string, arrives as string in renderer
});
```

Correct:

```typescript
const dateSerializer = createValueSerializer({
	isDeserialized: (value): value is Date => value instanceof Date,
	isSerialized: (value): value is string =>
		typeof value === "string" && !isNaN(Date.parse(value)),
	serialize: (value) => value.toISOString(),
	deserialize: (value) => new Date(value),
});

const serializer = createSerializer([dateSerializer]);
const disposeIpc = createIpcMain(definition, { serializer });
```

Default serializer passes through all values; structured clone serializes Date as string, and no deserializer converts it back. The renderer receives a string, not a Date object.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts

### HIGH Sending Map or Set objects

Wrong:

```typescript
query<Map<string, number>, undefined>((event) => {
	return new Map([
		["a", 1],
		["b", 2],
	]); // Arrives as {} in renderer
});
```

Correct:

```typescript
// Option 1: Serialize as array of entries
query<Array<[string, number]>, undefined>((event) => {
	return Array.from(
		new Map([
			["a", 1],
			["b", 2],
		]).entries(),
	);
});

// Option 2: Use custom serializer
const mapSerializer = createValueSerializer({
	isDeserialized: (value): value is Map<any, any> => value instanceof Map,
	isSerialized: (value): value is Array<[any, any]> => Array.isArray(value),
	serialize: (value) => Array.from(value.entries()),
	deserialize: (value) => new Map(value),
});
```

Default serializer converts Map and Set to empty objects. Use custom serializers or convert to arrays before sending.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts

### MEDIUM Custom class instances not handled by structured clone

Wrong:

```typescript
class User {
	constructor(
		public id: string,
		public name: string,
	) {}
	getDisplayName() {
		return `${this.name} (#${this.id})`;
	}
}

query<User, undefined>((event) => {
	return new User("123", "Alice"); // Arrives as plain object, no methods
});
```

Correct:

```typescript
query<{ id: string; name: string }, undefined>((event) => {
	const user = new User("123", "Alice");
	return { id: user.id, name: user.name };
});

// Or reconstruct in renderer after deserialization
const response = await tipc.getUser.query();
const user = Object.assign(Object.create(User.prototype), response);
```

Custom class instances serialize as plain objects, losing prototype methods. Extract properties before sending, or accept that the renderer receives plain objects.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts

### MEDIUM Circular references in serialized objects

Wrong:

```typescript
const obj: any = { a: 1 };
obj.self = obj; // Circular reference

query<typeof obj, undefined>((event) => obj); // Will fail
```

Correct:

```typescript
query<{ a: number }, undefined>((event) => {
	return { a: 1 }; // No circular refs
});
```

Default serializer recursively traverses objects; circular references cause traversal to hang or throw. Avoid circular references in IPC payloads.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts

### HIGH Not composing serializers in correct order

Wrong:

```typescript
const s1 = createValueSerializer({
	isDeserialized: (v) => typeof v === "object", // Too broad!
	isSerialized: (v) => typeof v === "object",
	serialize: (v) => JSON.stringify(v),
	deserialize: (v) => JSON.parse(v),
});

const serializers = [s1, dateSerializer];
// s1 matches first for everything; dateSerializer never used
```

Correct:

```typescript
const serializers = [
	dateSerializer,
	mapSerializer,
	setSerializer,
	customClassSerializer,
	// Generic fallback last (if needed)
];
const serializer = createSerializer(serializers);
```

`createSerializer` checks each serializer in order; the first matching predicate wins. Broad predicates must come last to avoid shadowing specific serializers.

Source: kvsingh/electron-libs:packages/electron-typed-ipc/src/serializer.ts
