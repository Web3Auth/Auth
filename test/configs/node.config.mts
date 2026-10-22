import { readFileSync } from "node:fs";

// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  define: {
    "process.env.AUTH_VERSION": JSON.stringify(pkg.version),
  },
  test: {
    reporters: "verbose",
    coverage: {
      reporter: ["text"],
      provider: "istanbul",
      include: ["src/**/*.ts"],
    },
    environment: "node",
  },
});
