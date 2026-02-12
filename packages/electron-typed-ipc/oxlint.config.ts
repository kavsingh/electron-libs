import { defineConfig } from "oxlint";

// oxlint-disable-next-line import/no-relative-parent-imports
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
			files: ["src/**"],
			plugins: ["import"],
			env: { node: false, browser: false },
			rules: {
				"eslint/no-console": "error",
				"import/no-nodejs-modules": "error",
				"import/no-relative-parent-imports": "off",
			},
		},
		{
			files: ["src/main.ts", "src/vitest.setup.ts"],
			plugins: ["import"],
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
			plugins: ["vitest"],
			rules: {
				"eslint/max-lines-per-function": "off",
				"eslint/no-console": "off",
				"import/no-namespace": "off",
				"unicorn/consistent-function-scoping": "off",
				"vitest/no-disabled-tests": "error",
				"vitest/no-focused-tests": "error",
				"vitest/prefer-to-be-falsy": "off",
				"vitest/prefer-to-be-truthy": "off",
			},
		},
		{
			files: ["src/**/*.test-d.ts"],
			rules: {
				"eslint/no-unused-expressions": "off",
			},
		},
	],
	settings: {
		vitest: { typecheck: true },
	},
});
