/* eslint-disable @typescript-eslint/no-var-requires */
const { EnvironmentPlugin } = require("webpack");
const pkg = require("./package.json");

const generateWebpackConfig = require("../../webpack.config");

const config = generateWebpackConfig({ plugins: [new EnvironmentPlugin({ OPENLOGIN_VERSION: pkg.version })] });

exports.baseConfig = config.baseConfig;
