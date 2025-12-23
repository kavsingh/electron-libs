import { defineConfig } from "eslint/config";
import playwright from "eslint-plugin-playwright";

import baseConfig from "../../eslint.config.js";

export default defineConfig(
	{ ignores: ["dist/*", "reports/*"] },

	...baseConfig,

	{
		files: ["./e2e/**/*.test.ts"],
		extends: [playwright.configs["flat/recommended"]],
	},
);
