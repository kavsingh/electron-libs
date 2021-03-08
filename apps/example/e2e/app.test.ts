import { test, expect } from "@playwright/test";

import { setupApplication, teardownApplication } from "./lib/application.ts";

import type { ElectronApplication } from "@playwright/test";

test.describe("app tests", () => {
	let app: ElectronApplication;

	test.beforeAll(async () => {
		app = await setupApplication();
	});

	test.afterAll(async () => {
		await teardownApplication(app);
	});

	test("should be able to ping", async () => {
		const page = await app.firstWindow();

		await page.getByRole("button", { name: "ping" }).click();

		await expect(page.getByText("pong")).toBeVisible();
	});
});
