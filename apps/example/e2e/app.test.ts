import { test, expect } from "@playwright/test";

import { setupApplication, teardownApplication } from "./lib/application.ts";

import type { ElectronApplication } from "@playwright/test";

test.describe("app tests", () => {
	let app: ElectronApplication;

	test.beforeEach(async () => {
		app = await setupApplication();
	});

	test.afterEach(async () => {
		await teardownApplication(app);
	});

	test("it should be able to complete req / res", async () => {
		const page = await app.firstWindow();

		await page.getByRole("button", { name: "req" }).click();

		await expect(page.getByText("res")).toBeVisible();
	});

	test("it should be able to complete pub / sub", async () => {
		const page = await app.firstWindow();

		await expect(page.getByText("pong (ping)")).toBeVisible();
	});
});
