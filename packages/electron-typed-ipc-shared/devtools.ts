const DEVTOOLS_EVENT_BUS_NAME = "__DEV__electron-typed-ipc-event-bus__";
const DEVTOOLS_EVENT_NAME = "__DEV__electron-typed-ipc-event__";

interface BaseDevtoolsEvent {
	channel: string;
	timestamp: number;
}

type ResolutionResult =
	| { type: "success"; response: unknown }
	| { type: "error"; cause: unknown };

type DevtoolsEvent = BaseDevtoolsEvent &
	(
		| { type: "queryStarted"; id: string; input: unknown }
		| { type: "queryResolved"; id: string; result: ResolutionResult }
		| { type: "mutationStarted"; id: string; input: unknown }
		| { type: "mutationResolved"; id: string; result: ResolutionResult }
		| { type: "sendFromMain"; payload: unknown }
		| { type: "sendFromRenderer"; payload: unknown }
	);

interface DevtoolsEventBus {
	publish(event: DevtoolsEvent): void;
	subscribe(listener: (event: DevtoolsEvent) => void): () => void;
}

function isValidDevtoolsEvent(event: unknown): event is DevtoolsEvent {
	const isObjectWithType =
		event &&
		typeof event === "object" &&
		"type" in event &&
		typeof event.type === "string";

	if (!isObjectWithType) return false;

	switch (event.type) {
		case "queryStarted":
		case "queryResolved":
		case "mutationStarted":
		case "mutationResolved":
		case "sendFromMain":
		case "sendFromRenderer":
			return true;

		default:
			return false;
	}
}

export { DEVTOOLS_EVENT_BUS_NAME, DEVTOOLS_EVENT_NAME, isValidDevtoolsEvent };
export type { DevtoolsEvent, DevtoolsEventBus };
