import { DEVTOOLS_EVENT_BUS_NAME } from "electron-typed-ipc-shared/devtools";
import { render } from "solid-js/web";

import css from "./app.css?inline";
import { EventBus } from "./event-bus";

function renderDevtools(container: HTMLElement) {
	const style = document.createElement("style");
	const eventBus = new EventBus();

	// @ts-expect-error avoid leaking event bus to global window types
	globalThis.window[DEVTOOLS_EVENT_BUS_NAME] = eventBus;
	style.setAttribute("type", "text/css");
	style.textContent = css;
	document.head.appendChild(style);

	const unmount = render(
		() => <div data-electron-typed-ipc-devtools>Devtools</div>,
		container,
	);

	function dispose() {
		unmount();

		try {
			document.head.removeChild(style);
		} catch {
			// noop
		}
	}

	return { dispose };
}

export { renderDevtools };
