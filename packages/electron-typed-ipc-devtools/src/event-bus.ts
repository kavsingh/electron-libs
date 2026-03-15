import {
	DEVTOOLS_EVENT_NAME,
	isValidDevtoolsEvent,
} from "electron-typed-ipc-shared/devtools";

import type {
	DevtoolsEventBus,
	DevtoolsEvent,
} from "electron-typed-ipc-shared/devtools";

class EventBus implements DevtoolsEventBus {
	readonly #target = new EventTarget();

	publish(event: DevtoolsEvent): void {
		this.#target.dispatchEvent(
			new CustomEvent(DEVTOOLS_EVENT_NAME, { detail: event }),
		);
	}

	subscribe(listener: (event: DevtoolsEvent) => void): () => void {
		function handler(event: Event) {
			if (event instanceof CustomEvent && isValidDevtoolsEvent(event.detail)) {
				listener(event.detail);
			}
		}

		this.#target.addEventListener(DEVTOOLS_EVENT_NAME, handler);

		return () => {
			this.#target.removeEventListener(DEVTOOLS_EVENT_NAME, handler);
		};
	}
}

export { EventBus };
