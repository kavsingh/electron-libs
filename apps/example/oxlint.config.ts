import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";

import baseConfig from "../../oxlint.config.ts";

export default defineConfig({
	extends: [baseConfig],
	env: { node: true, browser: false },
	ignorePatterns: [
		"dist/**",
		"reports/**",
		"**/__generated__/**",
		"!**/__generated__/__mocks__/**",
	],
	overrides: [
		{
			files: ["electron/*", "e2e/*"],
			env: { node: true, browser: false },
			rules: { "unicorn/prefer-event-target": "off" },
		},
		{
			files: ["renderer/*"],
			env: { node: false, browser: true },
			rules: { "import/no-nodejs-modules": "error" },
		},
		{
			files: ["e2e/**/*.test.ts"],
			jsPlugins: ["eslint-plugin-playwright"],
			// @ts-expect-error upstream types
			rules: { ...playwright.configs["flat/recommended"].rules },
		},
	],
});
