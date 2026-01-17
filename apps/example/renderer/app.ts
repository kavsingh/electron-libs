import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcDefinitions } from "../electron/main.ts";

function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

export function mount() {
	const tipc = createIpcRenderer<AppIpcDefinitions>();

	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => {
		return JSON.stringify(globalThis.location, undefined, 2);
	});

	window.addEventListener("message", (event) => {
		updateDisplay(
			"posts",
			(current) => `${current}<br/>${event.data} (${event.origin})`,
		);
	});

	async function handleReqClick() {
		const res = await tipc.req.query();

		updateDisplay("res", (current) => `${current}<br/>${res}`);
	}

	document.querySelector("[data-click=req]")?.addEventListener("click", () => {
		void handleReqClick();
	});

	document.querySelector("[data-click=post]")?.addEventListener("click", () => {
		window.postMessage("message", "*");
	});

	tipc.pong.subscribe((_, message) => {
		updateDisplay("pongs", (current) => `${current}<br/>${message}`);
	});

	setInterval(() => {
		tipc.ping.send("ping");
	}, 500);
}

document.addEventListener("DOMContentLoaded", mount);
