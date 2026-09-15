import { test, expect } from "./fixtures.ts";

import type { Page } from "@playwright/test";

function eventsModel(page: Page) {
	return {
		sendEvent: () => {
			return page.getByRole("button", { name: "send event" }).click();
		},
		subscribe: (label: string) => {
			return page
				.getByRole("button", { name: new RegExp(`^subscribe ${label}$`) })
				.click();
		},
		unsubscribe: (label: string) => {
			return page
				.getByRole("button", { name: new RegExp(`^unsubscribe ${label}$`) })
				.click();
		},
		locateMessages: (label: string) => {
			return page.getByText(`[${label}] event acknowledged (ping)`);
		},
	};
}

test.describe("ipc", () => {
	test("queries", async ({ page }) => {
		await page.getByRole("button", { name: "query" }).click();

		await expect(page.getByText("query response")).toBeVisible();
	});

	test("mutations", async ({ page }) => {
		await page.getByRole("button", { name: "mutate" }).click();

		await expect(page.getByText("mutation response (input)")).toBeVisible();
	});

	test("events", async ({ page }) => {
		const { subscribe, unsubscribe, sendEvent, locateMessages } =
			eventsModel(page);

		await sendEvent();

		await expect(locateMessages("a")).toHaveCount(0);
		await expect(locateMessages("b")).toHaveCount(0);

		await subscribe("a");
		await sendEvent();

		await expect(locateMessages("a")).toHaveCount(1);
		await expect(locateMessages("b")).toHaveCount(0);

		await subscribe("b");
		await sendEvent();

		await expect(locateMessages("a")).toHaveCount(2);
		await expect(locateMessages("b")).toHaveCount(1);

		await unsubscribe("a");
		await sendEvent();

		await expect(locateMessages("a")).toHaveCount(2);
		await expect(locateMessages("b")).toHaveCount(2);

		await unsubscribe("b");
		await sendEvent();

		await expect(locateMessages("a")).toHaveCount(2);
		await expect(locateMessages("b")).toHaveCount(2);
	});
});
