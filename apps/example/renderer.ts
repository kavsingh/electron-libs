import { createElectronTypedIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcSchema } from "./common.ts";

export function mount() {
	const appMount = document.querySelector("#app");

	if (!(appMount instanceof HTMLElement)) throw new Error("no valid #app");

	const tipc = createElectronTypedIpcRenderer<AppIpcSchema>();
	const pingButton = document.createElement("button");
	const pongDisplay = document.createElement("div");
	const helloDisplay = document.createElement("div");

	for (const el of [pingButton, pongDisplay, helloDisplay]) {
		appMount.appendChild(el);
	}

	pingButton.innerText = "ping";
	pingButton.addEventListener("click", () => {
		void tipc.ping
			.query()
			.then((result) => (pongDisplay.innerHTML += `<br/>${result}`));
	});

	tipc.helloNow.subscribe((_, message) => {
		helloDisplay.innerHTML = message;
	});
}

document.addEventListener("DOMContentLoaded", mount);
