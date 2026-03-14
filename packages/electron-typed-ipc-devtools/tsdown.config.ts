import solid from "rolldown-plugin-solid";
import { defineConfig } from "tsdown";

export default defineConfig([
	{
		clean: true,
		entry: ["./src/index.ts"],
		dts: { build: true },
		platform: "browser",
		format: ["esm"],
		plugins: [solid()],
	},
]);
