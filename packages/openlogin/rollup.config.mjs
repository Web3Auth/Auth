/* eslint-disable import/no-extraneous-dependencies */
import replace from "@rollup/plugin-replace";
// eslint-disable-next-line import/extensions
import { readJSONFile } from "@toruslabs/torus-scripts/helpers/utils.js";
import path from "path";

const pkg = await readJSONFile(path.resolve("./package.json"));

export default {
  plugins: [
    replace({
      "process.env.OPENLOGIN_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
  ],
};
