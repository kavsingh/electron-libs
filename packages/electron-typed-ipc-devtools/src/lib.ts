import type { DevtoolsEvent } from "electron-typed-ipc-shared/devtools";

type RequestStartEvent = Extract<
	DevtoolsEvent,
	{ type: "queryStarted" | "mutationStarted" }
>;

type RequestEndEvent = Extract<
	DevtoolsEvent,
	{ type: "queryResolved" | "mutationResolved" }
>;

interface TimelineRequest {
	type: "request";
	startEvent: RequestStartEvent;
	endEvent?: RequestEndEvent | undefined;
}

interface TimelineEvent {
	type: "event";
	event: Extract<DevtoolsEvent, { type: "sendFromMain" | "sendFromRenderer" }>;
}

interface Timeline {
	items: Array<TimelineRequest | TimelineEvent>;
	maxTimestamp: number;
}

function createTimelineFromEvents(events: DevtoolsEvent[]): Timeline {
	const timeline: Timeline = { items: [], maxTimestamp: 0 };
	const requestMap = new Map<string, TimelineRequest>();

	for (const event of events) {
		if (event.type === "sendFromMain" || event.type === "sendFromRenderer") {
			timeline.items.push({ type: "event", event });

			if (event.timestamp > timeline.maxTimestamp) {
				timeline.maxTimestamp = event.timestamp;
			}

			continue;
		}

		if (event.type === "queryStarted" || event.type === "mutationStarted") {
			const request: TimelineRequest = { type: "request", startEvent: event };
			timeline.items.push(request);
			requestMap.set(event.id, request);
			continue;
		}

		const existing = requestMap.get(event.id);

		if (!existing || existing.endEvent) continue;

		existing.endEvent = event;

		if (event.timestamp > timeline.maxTimestamp) {
			timeline.maxTimestamp = event.timestamp;
		}
	}

	return timeline;
}

export { createTimelineFromEvents };
export type { TimelineRequest, TimelineEvent, Timeline };
