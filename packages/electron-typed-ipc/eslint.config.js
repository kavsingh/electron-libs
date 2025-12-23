import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "eslint/config";

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
);
