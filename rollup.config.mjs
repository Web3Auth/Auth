import replace from "@rollup/plugin-replace";
import { readJSONFile } from "@toruslabs/torus-scripts/helpers/utils.js";
import path from "path";

const pkg = await readJSONFile(path.resolve("./package.json"));
const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

const forcedBundledDeps = ["color"];
const deps = [...allDeps].filter((x) => !forcedBundledDeps.includes(x));

export const baseConfig = {
  plugins: [
    replace({
      "process.env.AUTH_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
  ],
  external: [...deps, ...deps.map((x) => new RegExp(`^${x}/`)), /@babel\/runtime/],
};
