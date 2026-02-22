import path from "node:path";

import { _electron, test as _test } from "@playwright/test";

import type { Page } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../");

interface Fixtures {
	app: ElectronApplication;
	mainWindow: Page;
	__init: true;
}

export { expect } from "@playwright/test";

export const test = _test.extend<Fixtures>({
	__init: true,

	// dummy __init fixture to use destructing syntax without accessing page;
	// accessing page here causes playwright to require an additional headless
	// browser to be installed
	async app({ __init: _ }, use) {
		let app: ElectronApplication | undefined;

		try {
			app = await _electron.launch({
				args: [path.join(PROJECT_ROOT, "dist/main.mjs")],
				colorScheme: "dark",
				env: { IS_E2E: "true" },
			});

			await use(app);
		} finally {
			await app?.close();
		}
	},

	async mainWindow({ app }, use) {
		await use(await app.firstWindow());
	},
});
