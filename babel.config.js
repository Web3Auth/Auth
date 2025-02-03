const torusConfig = require("@toruslabs/config/babel.config.js");

module.exports = {
  ...torusConfig,
  plugins: [...torusConfig.plugins, "babel-plugin-transform-object-hasown"],
};
