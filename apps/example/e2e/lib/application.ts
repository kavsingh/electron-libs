import path from "node:path";

import { _electron as electron } from "@playwright/test";

import type { ElectronApplication } from "@playwright/test";

export function setupApplication() {
	return electron.launch({
		args: [path.resolve(import.meta.dirname, "../../dist/main.mjs")],
		colorScheme: "dark",
		env: { IS_E2E: "true" },
	});
}

export function teardownApplication(app: ElectronApplication) {
	return app.close();
}
