import path from "node:path";

import { _electron as electron } from "@playwright/test";

import { PROJECT_ROOT } from "./constants.ts";

import type { ElectronApplication } from "@playwright/test";

export function setupApplication() {
	return electron.launch({
		args: [path.join(PROJECT_ROOT, "dist/main.mjs")],
		env: { IS_E2E: "true" },
	});
}

export function teardownApplication(app: ElectronApplication) {
	return app.close();
}
