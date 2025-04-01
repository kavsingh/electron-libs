import path from "node:path";
import { fileURLToPath } from "node:url";

import vitest from "eslint-plugin-vitest";
import globals from "globals";
import * as tsEslint from "typescript-eslint";

import baseConfig from "../../eslint.config.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default tsEslint.config(
	{
		ignores: ["dist/*", "reports/*"],
	},

	...baseConfig,

	{
		settings: {
			"import-x/resolver": {
				"eslint-import-resolver-typescript": {
					project: path.resolve(dirname, "./tsconfig.json"),
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
		extends: [vitest.configs.all],
		rules: {
			"vitest/no-hooks": "off",
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
);
