/* eslint-disable import/no-extraneous-dependencies */
import replace from "@rollup/plugin-replace";
// eslint-disable-next-line import/extensions
import { readFile } from "@toruslabs/torus-scripts/helpers/utils.js";
const pkg = await readFile(new URL("./package.json", import.meta.url).href);

export default {
  plugins: [
    replace({
      "process.env.OPENLOGIN_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
  ],
};
