import playwright from "eslint-plugin-playwright";
import { defineConfig } from "eslint/config";
import { configs as tsEslint } from "typescript-eslint";

// TODO: move eslint plugins to oxlint jsPlugins once available in language server

export default defineConfig(
	{
		ignores: ["**/*", "!e2e/**/*.test.ts"],
		linterOptions: { reportUnusedDisableDirectives: true },
	},

	{
		files: ["./e2e/**/*.test.ts"],
		extends: [tsEslint.base, playwright.configs["flat/recommended"]],
	},
);
