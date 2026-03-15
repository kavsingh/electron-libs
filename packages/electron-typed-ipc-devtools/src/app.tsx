import { Show, createSignal, createMemo } from "solid-js";
import { Portal, render } from "solid-js/web";

import css from "./app.css?inline";
import { DevtoolsEventsProvider, useDevtoolsEvents } from "./context";

const [panelIsOpen, setPanelIsOpen] = createSignal(false);

function DevtoolsTrigger() {
	return (
		<div data-electron-typed-ipc-devtools>
			<button
				class="etid--devtools-trigger"
				onClick={() => void setPanelIsOpen((current) => !current)}
			>
				Devtools
			</button>
		</div>
	);
}

function DevtoolsPanel() {
	const events = useDevtoolsEvents();
	const mostRecentEvent = createMemo(() => events.events.at(-1));

	return (
		<Show when={panelIsOpen()}>
			<Portal>
				<div data-electron-typed-ipc-devtools>
					<div class="etid--devtools-panel">
						<div>Devtools Panel</div>
						<Show when={mostRecentEvent()}>
							{(event) => <div>{JSON.stringify(event())}</div>}
						</Show>
					</div>
				</div>
			</Portal>
		</Show>
	);
}

function Devtools() {
	return (
		<>
			<DevtoolsTrigger />
			<DevtoolsEventsProvider>
				<DevtoolsPanel />
			</DevtoolsEventsProvider>
		</>
	);
}

function renderDevtools(triggerContainer: HTMLElement) {
	const style = document.createElement("style");

	style.setAttribute("type", "text/css");
	style.textContent = css;
	document.head.appendChild(style);

	const unmount = render(() => <Devtools />, triggerContainer);

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
