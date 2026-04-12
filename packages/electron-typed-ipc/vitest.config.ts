import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		setupFiles: ["./src/vitest.setup.ts"],
		coverage: {
			include: ["src/**"],
			exclude: [
				"**/__generated__/**",
				"**/*.test-d.ts",
				"**/*.test.ts",
				"**/types.ts",
			],
			provider: "v8",
			reporter: ["text", "json-summary", "html"],
			reportsDirectory: "./reports/vitest/coverage",
		},
	},
});
