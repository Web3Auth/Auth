/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import typescript from "@rollup/plugin-typescript";
import path from "path";
import sourceMaps from "rollup-plugin-sourcemaps";

function generateRollupConfig({ pkg, pkgName, currentPath }) {
  return [
    {
      input: path.resolve(currentPath, "src", "index.ts"),
      external: [...Object.keys(pkg.dependencies)],
      output: [{ file: `dist/${pkgName}.esm.js`, format: "es", sourcemap: true }],
      plugins: [typescript({ tsconfig: path.resolve(currentPath, "tsconfig.build.json") }), sourceMaps()],
    },
  ];
}

export default generateRollupConfig;
