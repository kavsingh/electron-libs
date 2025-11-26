import path from "node:path";
import { fileURLToPath } from "node:url";

import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "eslint/config";
import globals from "globals";

import baseConfig from "../../eslint.config.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
	{
		ignores: ["dist/*", "reports/*"],
	},

	...baseConfig,

	{
		settings: {
			"import-x/resolver": {
				"eslint-import-resolver-typescript": {
					project: [
						path.resolve(dirname, "./tsconfig.json"),
						path.resolve(dirname, "./src/tsconfig.json"),
					],
				},
			},
		},
	},

	{
		files: ["src/**/*.?(m|c)[tj]s?(x)"],
		rules: { "no-console": "error" },
	},

	{
		files: ["**/*.test.ts", "**/*.test?(-d).ts"],
		languageOptions: { globals: { ...globals.node } },
		settings: { vitest: { typecheck: true } },
		extends: [vitest.configs.all],
		rules: {
			"vitest/no-hooks": "off",
			"vitest/require-mock-type-parameters": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/unbound-method": "off",
		},
	},

	{
		files: ["**/*.test-d.ts"],
		rules: {
			"vitest/valid-expect": "off",
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
);
