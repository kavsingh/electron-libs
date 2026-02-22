import { test, expect } from "./fixtures.ts";

test.describe("ipc tests", () => {
	test("it should be able to complete req / res over ipc", async ({
		mainWindow,
	}) => {
		await mainWindow.getByRole("button", { name: "req" }).click();

		await expect(mainWindow.getByText("res")).toBeVisible();
	});

	test("it should be able to complete pub / sub over ipc", async ({
		mainWindow,
	}) => {
		await expect(mainWindow.getByText("pong (ping)")).toBeVisible();
	});
});
