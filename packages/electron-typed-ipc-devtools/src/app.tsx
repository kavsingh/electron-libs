import { Show, createSignal, createMemo, For } from "solid-js";
import { Portal, render } from "solid-js/web";

import css from "./app.css?inline";
import { DevtoolsEventsProvider, useDevtoolsEvents } from "./context";
import { createTimelineFromEvents } from "./lib";

import type { TimelineEvent, TimelineRequest, Timeline } from "./lib";
import type { JSX } from "solid-js";

const [panelIsOpen, setPanelIsOpen] = createSignal(false);

function computePosition(
	minTimestamp: number,
	item: TimelineRequest | TimelineEvent,
	timeline: Timeline,
): JSX.CSSProperties {
	const range = timeline.maxTimestamp - minTimestamp;
	const norm = (n: number) => ((n - minTimestamp) / range) * 100;

	if (item.type === "event") {
		const percent = norm(item.event.timestamp);

		return {
			"inset-inline-start": `calc(${percent}% - 2px)`,
			"inset-inline-end": `${100 - percent}%`,
		};
	}

	return {
		"inset-inline-start": `${norm(item.startEvent.timestamp)}%`,
		"inset-inline-end": item.endEvent
			? `${100 - norm(item.endEvent.timestamp)}%`
			: 0,
		// "inset-inline-end": 0,
	};
}

function Timeline() {
	const devtoolsEvents = useDevtoolsEvents();
	const timeline = createMemo(() => {
		return createTimelineFromEvents(devtoolsEvents.events);
	});

	return (
		<div>
			<For each={timeline().items}>
				{(item) => (
					<div class="etid--timeline-item">
						<div
							style={computePosition(
								devtoolsEvents.minTimestamp,
								item,
								timeline(),
							)}
						/>
					</div>
				)}
			</For>
		</div>
	);
}

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
	return (
		<Show when={panelIsOpen()}>
			<Portal>
				<div data-electron-typed-ipc-devtools class="etid--devtools-panel">
					<div>Devtools Panel</div>
					<Timeline />
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
