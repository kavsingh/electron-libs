import { test, expect } from "./fixtures.ts";

test.describe("ipc", () => {
	test("completes req / res", async ({ page }) => {
		await page.getByRole("button", { name: "req" }).click();

		await expect(page.getByText("res")).toBeVisible();
	});

	test("completes pub / sub", async ({ page }) => {
		await expect(page.getByText("pong (ping)")).toBeVisible();
	});
});
