import { render } from "solid-js/web";

import css from "./app.css?inline";

function renderDevtools(container: HTMLElement) {
	const style = document.createElement("style");

	style.setAttribute("type", "text/css");
	style.textContent = css;
	document.head.appendChild(style);

	const unmount = render(
		() => <div data-electron-typed-ipc-devtools>Devtools</div>,
		container,
	);

	function dispose() {
		unmount();

		try {
			document.head.removeChild(style);
		} catch {
			// noop
		}
	}

	return { dispose };
}

export { renderDevtools };
