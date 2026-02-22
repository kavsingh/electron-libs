import path from "node:path";

import { _electron as electron, test as baseTest } from "@playwright/test";

import type { Page } from "@playwright/test";
import type { ElectronApplication } from "@playwright/test";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../");

interface Fixtures {
	app: ElectronApplication;
	mainWindow: Page;
}

export { expect } from "@playwright/test";

export const test = baseTest.extend<Fixtures>({
	async app({ page: _ }, use) {
		let app: ElectronApplication | undefined;

		try {
			app = await electron.launch({
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
