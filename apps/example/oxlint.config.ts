import { baseConfig } from "code-config/oxlint";
import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";

import type { OxlintConfig } from "oxlint";

const config: OxlintConfig = defineConfig({
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
		},
		{
			files: ["renderer/*"],
			env: { node: false, browser: true },
			rules: { "import/no-nodejs-modules": "error" },
		},
		{
			files: ["e2e/**/*.test.ts"],
			jsPlugins: ["eslint-plugin-playwright"],
			rules: { ...playwright.configs["flat/recommended"].rules },
		},
	],
});

export default config;
