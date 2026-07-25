import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { Subscription } from "@kavsingh/electron-typed-ipc/renderer";
import type { AppIpcDefinitions } from "~/electron/ipc";

type Tipc = ReturnType<typeof createIpcRenderer<AppIpcDefinitions>>;

function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

function setupSubscription(tipc: Tipc, label: string) {
	const subscribeButton = document.querySelector(
		`[data-click=subscribe-${label}]`,
	);
	const unsubscribeButton = document.querySelector(
		`[data-click=unsubscribe-${label}]`,
	);
	let subscription: Subscription | undefined;

	subscribeButton?.addEventListener("click", () => {
		subscription ??= tipc.testSendFromMain.subscribe((message: string) => {
			updateDisplay(
				`events-from-main-${label}`,
				(current) => `${current}<li>[${label}] ${message}</li>`,
			);
		});
		subscribeButton.setAttribute("disabled", "true");
		unsubscribeButton?.removeAttribute("disabled");
	});

	unsubscribeButton?.addEventListener("click", () => {
		subscription?.unsubscribe();
		subscription = undefined;
		unsubscribeButton.setAttribute("disabled", "true");
		subscribeButton?.removeAttribute("disabled");
	});
}

function mount() {
	const tipc = createIpcRenderer<AppIpcDefinitions>({ logger: console });

	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => {
		return JSON.stringify(globalThis.location, undefined, 2);
	});

	setupSubscription(tipc, "a");
	setupSubscription(tipc, "b");

	window.addEventListener("message", (event) => {
		updateDisplay(
			"postmessages",
			(current) => `${current}<li>${event.data} (${event.origin})</li>`,
		);
	});

	document
		.querySelector("[data-click=query]")
		?.addEventListener("click", () => {
			void tipc.testQuery.query().then((res) => {
				updateDisplay(
					"query-responses",
					(current) => `${current}<li>${res}</li>`,
				);
			});
		});

	document
		.querySelector("[data-click=mutate]")
		?.addEventListener("click", () => {
			void tipc.testMutation.mutate("input").then((res) => {
				updateDisplay(
					"query-responses",
					(current) => `${current}<li>${res}</li>`,
				);
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
