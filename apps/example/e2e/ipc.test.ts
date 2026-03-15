import { test, expect } from "./fixtures.ts";

test.describe("ipc", () => {
	test("completes query", async ({ page }) => {
		await page.getByRole("button", { name: "query" }).click();

		await expect(page.getByText("query response")).toBeVisible();
	});

	test("completes mutation", async ({ page }) => {
		await page.getByRole("button", { name: "mutate" }).click();

		await expect(page.getByText("mutation response (input)")).toBeVisible();
	});

	test("completes pub / sub", async ({ page }) => {
		await page.getByRole("button", { name: "send event" }).click();

		await expect(page.getByText("event acknowledged (ping)")).toBeVisible();
	});
});
