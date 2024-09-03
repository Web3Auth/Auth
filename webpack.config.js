/* eslint-disable @typescript-eslint/no-var-requires */
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { EnvironmentPlugin } = require("webpack");
const pkg = require("./package.json");

exports.baseConfig = {
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
  },
  plugins: [new EnvironmentPlugin({ AUTH_VERSION: pkg.version })],
};
