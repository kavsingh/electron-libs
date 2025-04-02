import { createElectronTypedIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcSchema } from "./common.ts";

function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

export function mount() {
	const tipc = createElectronTypedIpcRenderer<AppIpcSchema>();

	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => JSON.stringify(window.location, null, 2));

	window.onmessage = (event) => {
		updateDisplay(
			"posts",
			(current) => `${current}<br/>${event.data} (${event.origin})`,
		);
	};

	document.querySelector("[data-click=ping]")?.addEventListener("click", () => {
		void tipc.ping.query().then((response) => {
			updateDisplay("pong", (current) => `${current}<br/>${response}`);
		});
	});

	document.querySelector("[data-click=post]")?.addEventListener("click", () => {
		window.postMessage("message", "*");
	});

	tipc.helloNow.subscribe((_, message) => {
		updateDisplay("hello", () => message);
	});
}

document.addEventListener("DOMContentLoaded", mount);
