import replace from "@rollup/plugin-replace";
import pkg from "./package.json";

export default {
  plugins: [
    replace({
      "process.env.OPENLOGIN_VERSION": `"${pkg.version}"`,
      preventAssignment: true,
    }),
  ],
};
