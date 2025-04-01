import { createElectronTypedIpcRenderer } from "@kavsingh/electron-typed-ipc/renderer";

import type { AppIpcSchema } from "./common.ts";

export function mount() {
	const appMount = document.querySelector("#app");

	if (!(appMount instanceof HTMLElement)) throw new Error("no valid #app");

	const tipc = createElectronTypedIpcRenderer<AppIpcSchema>();

	appMount.innerHTML = `
	<button data-click="ping">ping</button>
	<div data-display="pong"></div>
	`;

	const display = document.querySelector("[data-display=pong]");

	if (!(display instanceof HTMLElement)) {
		throw new Error("display not available");
	}

	document.querySelector("[data-click=ping]")?.addEventListener("click", () => {
		void tipc.ping
			.query()
			.then((result) => (display.innerHTML += `<br/>${result}`));
	});
}

document.addEventListener("DOMContentLoaded", mount);
