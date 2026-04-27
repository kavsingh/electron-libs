import path from "node:path";

import { _electron, test as baseTest } from "@playwright/test";

import type { ElectronApplication } from "@playwright/test";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../");

interface Fixtures {
	app: ElectronApplication;
}

interface Options {
	appLaunchOptions?:
		| Partial<Parameters<typeof _electron.launch>[0]>
		| undefined;
}

export { expect } from "@playwright/test";

export const test = baseTest.extend<Fixtures & Options>({
	appLaunchOptions: [{}, { option: true }],

	// avoid accessing built-in page here; causes playwright to request that a
	// headless browser be installed
	async app({ appLaunchOptions }, use) {
		const app = await _electron.launch({
			args: [path.join(PROJECT_ROOT, "dist/main.mjs"), "--e2e"],
			colorScheme: "dark",
			...appLaunchOptions,
		});

		await use(app);
		await app.close();
	},

	async page({ app }, use) {
		await use(await app.firstWindow());
	},
});
