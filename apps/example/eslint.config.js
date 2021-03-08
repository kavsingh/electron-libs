import playwright from "eslint-plugin-playwright";
import globals from "globals";
import * as tsEslint from "typescript-eslint";

import baseConfig from "../../eslint.config.js";

export default tsEslint.config(
	{ ignores: ["dist/*", "reports/*"] },

	...baseConfig,

	{
		files: ["*.?(m|c)[tj]s?(x)"],
		rules: { "no-console": "error" },
	},

	{
		files: ["./main.ts"],
		languageOptions: { globals: { ...globals.node } },
	},

	{
		files: ["./preload.ts", "./renderer.ts"],
		languageOptions: { globals: { ...globals.browser } },
	},

	{
		files: ["./e2e/**/*.test.ts"],
		languageOptions: { globals: { ...globals.node } },
		extends: [playwright.configs["flat/recommended"]],
	},
);
