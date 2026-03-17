import { DEVTOOLS_EVENT_BUS_NAME } from "electron-typed-ipc-shared/devtools";
import { createContext, onCleanup, useContext, onMount } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { EventBus } from "./event-bus";

import type { DevtoolsEvent } from "electron-typed-ipc-shared/devtools";
import type { ParentProps } from "solid-js";

const [devtoolsEvents, updateDevtoolsEvents] = createStore<{
	minTimestamp: number;
	events: DevtoolsEvent[];
}>({ minTimestamp: 0, events: [] });

let eventBus: EventBus | undefined;

const Context = createContext<typeof devtoolsEvents>(undefined);

function DevtoolsEventsProvider(props: ParentProps) {
	eventBus ??= new EventBus();
	// @ts-expect-error avoid leaking event bus to global window types
	globalThis.window[DEVTOOLS_EVENT_BUS_NAME] = eventBus;

	let unsubscribe: (() => void) | undefined;

	onMount(() => {
		updateDevtoolsEvents("minTimestamp", Date.now());

		unsubscribe = eventBus?.subscribe((event) => {
			updateDevtoolsEvents(
				"events",
				produce((events) => void events.push(event)),
			);
		});
	});

	onCleanup(() => {
		unsubscribe?.();
	});

	return (
		<Context.Provider value={devtoolsEvents}>{props.children}</Context.Provider>
	);
}

function useDevtoolsEvents() {
	const value = useContext(Context);

	if (!value) {
		throw new Error(
			"useDevtoolsEvents must be used within a DevtoolsEventsProvider",
		);
	}

	return value;
}

export { DevtoolsEventsProvider, useDevtoolsEvents };
