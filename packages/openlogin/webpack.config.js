/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const { EnvironmentPlugin } = require("webpack");
const pkg = require("./package.json");

const generateWebpackConfig = require("../../webpack.config");

const currentPath = path.resolve(".");

const config = generateWebpackConfig({ currentPath, pkg, plugins: [new EnvironmentPlugin({ OPENLOGIN_VERSION: pkg.version })] });

exports.baseConfig = config.baseConfig;
