import { readFileSync } from "node:fs";

import { defineConfig } from "vite-plus/test/config";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  define: {
    "process.env.AUTH_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    include: ["test/**/*.test.ts", "src/**/__tests__/**/*.test.ts"],
    reporters: "verbose",
    coverage: {
      reporter: ["text"],
      provider: "istanbul",
      include: ["src/**/*.ts"],
    },
    environment: "node",
  },
});
