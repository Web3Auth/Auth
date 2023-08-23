/* eslint-disable @typescript-eslint/no-var-requires */
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

function generateWebpackConfig({ alias, plugins = [] }) {
  const baseConfig = {
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      alias: {
        ...alias,
      },
    },
    plugins,
  };
  return { baseConfig };
}

module.exports = generateWebpackConfig;
