const path = require("path");
const { ProvidePlugin } = require("webpack");

module.exports = {
  transpileDependencies: false,
  productionSourceMap: true,
  parallel: !process.env.CI,
  configureWebpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "bn.js": path.resolve(__dirname, "node_modules/bn.js"),
      lodash: path.resolve(__dirname, "node_modules/lodash"),
    };
    config.plugins.push(new ProvidePlugin({ Buffer: ["buffer", "Buffer"] }));
    config.plugins.push(new ProvidePlugin({ process: ["process/browser"] }));
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      http: false,
      https: false,
      os: false,
      crypto: false,
      assert: false,
      stream: false,
      zlib: false,
    };
  },
};
