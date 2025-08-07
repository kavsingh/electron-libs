export function mount() {
	const appMount = document.querySelector("#app");

	if (!(appMount instanceof HTMLElement)) throw new Error("no valid #app");

	appMount.innerHTML = `
		<pre>${JSON.stringify(window.location, null, 2)}</pre>
		<button data-click="ping">ping</button>
		<button data-click="post">post</button>
		<div data-display="pong"></div>
		<div data-display="posts"></div>
	`;

	document.querySelector("[data-click=ping]")?.addEventListener("click", () => {
		const display = document.querySelector("[data-display=pong]");

		if (display instanceof HTMLElement) {
			display.innerHTML += `<br/>${window.api.ping()}`;
		}
	});

	document.querySelector("[data-click=post]")?.addEventListener("click", () => {
		window.postMessage("message", "*");
	});

	window.onmessage = (event) => {
		const display = document.querySelector("[data-display=posts]");

		if (display instanceof HTMLElement) {
			display.innerHTML += `<br/>${event.data} (${event.origin})`;
		}
	};
}

document.addEventListener("DOMContentLoaded", mount);
