import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcDefinitions } from "~/electron/ipc";

function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

function mount() {
	const tipc = createIpcRenderer<AppIpcDefinitions>({ logger: console });

	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => {
		return JSON.stringify(globalThis.location, undefined, 2);
	});

	tipc.testSendFromMain.subscribe((...args) => {
		updateDisplay("events-from-main", (current) => `${current}<br/>${args[0]}`);
	});

	window.addEventListener("message", (event) => {
		updateDisplay(
			"postmessages",
			(current) => `${current}<br/>${event.data} (${event.origin})`,
		);
	});

	document
		.querySelector("[data-click=query]")
		?.addEventListener("click", () => {
			void tipc.testQuery.query().then((res) => {
				updateDisplay("query-responses", (current) => `${current}<br/>${res}`);
			});
		});

	document
		.querySelector("[data-click=mutate]")
		?.addEventListener("click", () => {
			void tipc.testMutation.mutate("input").then((res) => {
				updateDisplay("query-responses", (current) => `${current}<br/>${res}`);
			});
		});

	document
		.querySelector("[data-click=send-event]")
		?.addEventListener("click", () => {
			tipc.testSendFromRenderer.send("ping");
		});

	document
		.querySelector("[data-click=postmessage]")
		?.addEventListener("click", () => {
			window.postMessage("message", "*");
		});
}

document.addEventListener("DOMContentLoaded", mount);
