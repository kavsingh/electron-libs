import playwright from "eslint-plugin-playwright";
import { defineConfig } from "eslint/config";

import baseConfig from "../../eslint.config.js";

// TODO: move eslint plugins to oxlint jsPlugins once available in language server

export default defineConfig(
	{ ignores: ["dist/*", "reports/*"] },

	...baseConfig,

	{
		files: ["./e2e/**/*.test.ts"],
		extends: [playwright.configs["flat/recommended"]],
	},
);
