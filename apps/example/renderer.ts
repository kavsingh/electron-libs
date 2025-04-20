import { createIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcDefinitions } from "./main.ts";

export function mount() {
	const appMount = document.querySelector("#app");

	if (!(appMount instanceof HTMLElement)) throw new Error("no valid #app");

	const tipc = createIpcRenderer<AppIpcDefinitions>();
	const reqButton = document.createElement("button");
	const resDisplay = document.createElement("div");
	const pongDisplay = document.createElement("div");

	for (const el of [reqButton, resDisplay, pongDisplay]) {
		appMount.appendChild(el);
	}

	reqButton.innerText = "req";
	reqButton.addEventListener("click", () => {
		void tipc.req
			.query()
			.then((result) => (resDisplay.innerHTML += `<br/>${result}`));
	});

	tipc.pong.subscribe((_, message) => {
		pongDisplay.innerHTML = pongDisplay.innerHTML += `<br/>${message}`;
	});

	setInterval(() => {
		tipc.ping.send("ping");
	}, 500);
}

document.addEventListener("DOMContentLoaded", mount);
