function updateDisplay(select: string, updater: (current: string) => string) {
	const el = document.querySelector(`[data-display=${select}]`);

	if (el instanceof HTMLElement) el.innerHTML = updater(el.innerHTML);
}

export function mount() {
	updateDisplay("user-agent", () => navigator.userAgent);
	updateDisplay("location", () => JSON.stringify(window.location, null, 2));

	window.onmessage = (event) => {
		updateDisplay(
			"posts",
			(current) => `${current}<br/>${event.data} (${event.origin})`,
		);
	};

	document.querySelector("[data-click=ping]")?.addEventListener("click", () => {
		updateDisplay("pong", (current) => `${current}<br/>${window.api.ping()}`);
	});

	document.querySelector("[data-click=post]")?.addEventListener("click", () => {
		window.postMessage("message", "*");
	});
}

document.addEventListener("DOMContentLoaded", mount);
