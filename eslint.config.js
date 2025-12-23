import { defineConfig } from "eslint/config";
import { configs as tsEslint } from "typescript-eslint";

export default defineConfig(
	{ ignores: [".vscode/*", ".nx/*", ".temp/*"] },

	{ linterOptions: { reportUnusedDisableDirectives: true } },

	tsEslint.base,

	{
		rules: {
			"@typescript-eslint/no-shadow": [
				"error",
				{
					ignoreTypeValueShadow: false,
					ignoreFunctionTypeParameterNameValueShadow: true,
				},
			],
		},
	},
);
