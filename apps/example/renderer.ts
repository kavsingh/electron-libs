export function mount() {
	const appMount = document.querySelector("#app");

	if (!(appMount instanceof HTMLElement)) throw new Error("no valid #app");

	appMount.innerHTML = `
	<button data-click="ping">ping</button>
	<div data-display="pong"></div>
	`;

	document.querySelector("[data-click=ping]")?.addEventListener("click", () => {
		const display = document.querySelector("[data-display=pong]");

		if (display instanceof HTMLElement) {
			display.innerHTML += `<br/>${window.api.ping()}`;
		}
	});
}

document.addEventListener("DOMContentLoaded", mount);
