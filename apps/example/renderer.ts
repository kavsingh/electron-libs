import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcDefinitions } from "./main.ts";

function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

export function mount() {
	const tipc = createIpcRenderer<AppIpcDefinitions>();

	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => JSON.stringify(window.location, null, 2));

	window.onmessage = (event) => {
		updateDisplay(
			"posts",
			(current) => `${current}<br/>${event.data} (${event.origin})`,
		);
	};

	document.querySelector("[data-click=req]")?.addEventListener("click", () => {
		void tipc.req.query().then((res) => {
			updateDisplay("res", (current) => `${current}<br/>${res}`);
		});
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
