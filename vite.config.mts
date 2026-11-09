import { readFileSync } from "node:fs";

import { typescriptLintPreset } from "@toruslabs/oxlint-config-typescript";
import { formatPreset } from "@toruslabs/torus-scripts/fmt";
import { libraryPreset } from "@toruslabs/torus-scripts/library";
import { defineConfig } from "vite-plus";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

const library = libraryPreset({
  entry: ["src/index.ts", "src/core/index.ts", "src/ed25519/index.ts", "src/jrpc/index.ts", "src/subkey/index.ts", "src/utils/index.ts"],
  format: ["esm", "cjs"],
});
const lint = typescriptLintPreset();

// ESLint rules from @toruslabs/eslint-config-typescript@5 with no Oxlint rule:
// - import/extensions
// - import/no-extraneous-dependencies
// - simple-import-sort/imports (import order is formatPreset().sortImports)
// - prettier/prettier (formatting is formatPreset())
// The preset replaces @typescript-eslint/naming-convention with torus/type-names
// and @typescript-eslint/member-ordering with torus/member-ordering.

export default defineConfig({
  pack: {
    ...library.pack,
    unbundle: true,
    // ES2022 keeps Object.hasOwn native; consumers that target older runtimes must polyfill it.
    target: "es2022",
    define: {
      "process.env.AUTH_VERSION": JSON.stringify(pkg.version),
    },
    format: {
      esm: { outDir: "dist/lib.esm" },
      cjs: { outDir: "dist/lib.cjs" },
    },
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  },
  fmt: {
    ...formatPreset(),
    ignorePatterns: ["examples/**", "dist/**", "coverage/**", "package-lock.json", "CHANGELOG.md", ".changeset/*.md"],
  },
  lint,
});
