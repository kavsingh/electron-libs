import { defineConfig } from "eslint/config";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import { configs as tsEslint } from "typescript-eslint";

export default defineConfig(
	{ ignores: [".vscode/*", ".nx/*", ".temp/*"] },

	{
		linterOptions: { reportUnusedDisableDirectives: true },
		languageOptions: { parserOptions: { projectService: true } },
	},

	tsEslint.base,
	// @ts-expect-error upstream types
	importX.typescript,

	{
		rules: {
			"@typescript-eslint/no-shadow": [
				"error",
				{
					ignoreTypeValueShadow: false,
					ignoreFunctionTypeParameterNameValueShadow: true,
				},
			],
			"import-x/order": [
				"warn",
				{
					alphabetize: { order: "asc" },
					groups: [
						"builtin",
						"external",
						"internal",
						"parent",
						["sibling", "index"],
						"type",
					],
					pathGroupsExcludedImportTypes: ["type"],
					"newlines-between": "always",
				},
			],
		},
	},
);
