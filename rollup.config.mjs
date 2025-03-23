import replace from "@rollup/plugin-replace";
import { readJSONFile } from "@toruslabs/torus-scripts/helpers/utils.js";
import path from "path";

const pkg = await readJSONFile(path.resolve("./package.json"));

export const baseConfig = {
  plugins: [
    replace({
      "process.env.AUTH_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
  ],
};
