import path from "path";

import generateRollupConfig from "../../rollup.config";
import pkg from "./package.json";

const pkgName = pkg.name.split("/")[1] || pkg.name.split("/")[0];

const currentPath = path.resolve(".");

const config = generateRollupConfig({ pkg, pkgName, currentPath });

export default config;
