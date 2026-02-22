import path from "node:path";

import { _electron, test as baseTest } from "@playwright/test";

import type { ElectronApplication } from "@playwright/test";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../");

interface Fixtures {
	app: ElectronApplication;
}

export { expect } from "@playwright/test";

export const test = baseTest.extend<Fixtures>({
	// avoid accessing built-in page here; causes playwright to request that a
	// headless browser be installed
	async app({ launchOptions: _ }, use) {
		const app = await _electron.launch({
			args: [path.join(PROJECT_ROOT, "dist/main.mjs"), "--e2e"],
			colorScheme: "dark",
		});

		await use(app);
		await app.close();
	},

	async page({ app }, use) {
		await use(await app.firstWindow());
	},
});
