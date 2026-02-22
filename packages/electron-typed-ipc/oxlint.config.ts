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
	settings: { vitest: { typecheck: true } },
	rules: {
		"typescript/consistent-type-assertions": [
			"error",
			{ assertionStyle: "as" },
		],
	},
	overrides: [
		{
			files: ["src/**"],
			env: { node: false, browser: false },
			plugins: ["import"],
			rules: {
				"eslint/no-console": "error",
				"import/no-nodejs-modules": "error",
			},
		},
		{
			files: ["src/main.ts", "src/vitest.setup.ts"],
			env: { node: true, browser: false },
			rules: { "import/no-nodejs-modules": "off" },
		},
		{
			files: ["src/renderer.ts"],
			env: { node: false, browser: true },
		},
		{
			files: ["src/**/*.test.ts", "src/**/*.test-d.ts"],
			env: { browser: true, node: true },
			plugins: ["import", "vitest"],
			rules: {
				"eslint/no-console": "off",
				"import/no-nodejs-modules": "off",
				"vitest/no-disabled-tests": "error",
				"vitest/no-focused-tests": "error",
			},
		},
		{
			files: ["src/**/*.test-d.ts"],
			rules: { "eslint/no-unused-expressions": "off" },
		},
	],
});
