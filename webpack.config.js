/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const ESLintPlugin = require("eslint-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { ProvidePlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

function camelCase(input) {
  return input.toLowerCase().replace(/-(.)/g, (_, group1) => group1.toUpperCase());
}

function generateLibraryName(pkgName) {
  const usableName = camelCase(pkgName);
  return usableName.charAt(0).toUpperCase() + usableName.slice(1);
}

// loaders execute right to left

const packagesToInclude = ["@toruslabs/eccrypto", "pump", "end-of-stream", "keccak"];

const { NODE_ENV = "production" } = process.env;

const optimization = {
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};

const babelLoaderWithPolyfills = {
  test: /\.(ts|js)x?$/,
  exclude: /(node_modules|bower_components)/,
  use: {
    loader: "babel-loader",
    options: {
      rootMode: "upward",
    },
  },
};

const babelLoader = {
  ...babelLoaderWithPolyfills,
  use: { loader: "babel-loader", options: { plugins: ["@babel/transform-runtime"], rootMode: "upward" } },
};

function generateWebpackConfig({ pkg, pkgName, currentPath, alias }) {
  const depsList = Object.keys(pkg.dependencies);
  const baseConfig = {
    mode: NODE_ENV,
    devtool: NODE_ENV === "production" ? false : "source-map",
    entry: path.resolve(currentPath, "index.ts"),
    target: "web",
    output: {
      path: path.resolve(currentPath, "dist"),
      library: {
        name: generateLibraryName(pkgName),
      },
    },
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
      extensions: [".ts", ".js", ".json"],
      alias: {
        ...(depsList.includes("bn.js") && { "bn.js": path.resolve(currentPath, "node_modules/bn.js") }),
        ...(depsList.includes("lodash") && { lodash: path.resolve(currentPath, "node_modules/lodash") }),
        ...alias,
      },
      fallback: {
        buffer: require.resolve("buffer/"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        url: require.resolve("url/"),
        os: require.resolve("os-browserify/browser"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
      },
    },
    module: {
      rules: [],
    },
    plugins: [
      new ProvidePlugin({
        process: "process/browser",
      }),
    ],
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
  };

  const umdPolyfilledConfig = {
    ...baseConfig,
    output: {
      ...baseConfig.output,
      filename: `${pkgName}.polyfill.umd.min.js`,
      library: {
        ...baseConfig.output.library,
        type: "umd",
      },
    },
    module: {
      rules: [babelLoaderWithPolyfills],
    },
  };

  const umdConfig = {
    ...baseConfig,
    output: {
      ...baseConfig.output,
      filename: `${pkgName}.umd.min.js`,
      library: {
        ...baseConfig.output.library,
        type: "umd",
      },
    },
    module: {
      rules: [babelLoader],
    },
    // plugins: [...baseConfig.plugins, new BundleAnalyzerPlugin({ analyzerMode: "static" })],
  };

  const cjsConfig = {
    ...baseConfig,
    ...optimization,
    output: {
      ...baseConfig.output,
      filename: `${pkgName}.cjs.js`,
      library: {
        ...baseConfig.output.library,
        type: "commonjs2",
      },
    },
    module: {
      rules: [babelLoader],
    },
    externals: [...Object.keys(pkg.dependencies), /^(@babel\/runtime)/i],
    plugins: [
      new ESLintPlugin({
        extensions: ".ts",
        cwd: path.resolve(currentPath, "../../"),
      }),
    ],
  };

  const cjsBundledConfig = {
    ...baseConfig,
    ...optimization,
    output: {
      ...baseConfig.output,
      filename: `${pkgName}-bundled.cjs.js`,
      library: {
        ...baseConfig.output.library,
        type: "commonjs2",
      },
    },
    module: {
      rules: [babelLoader],
    },
    externals: [...Object.keys(pkg.dependencies).filter((x) => !packagesToInclude.includes(x)), /^(@babel\/runtime)/i],
  };

  return [umdPolyfilledConfig, umdConfig, cjsConfig, cjsBundledConfig];
  // return [umdConfig];
}

module.exports = generateWebpackConfig;
// module.exports = [cjsConfig];
// V5
// experiments: {
//   outputModule: true
// }

// node: {
//   global: true,
// },
// resolve: {
//   alias: { crypto: 'crypto-browserify', stream: 'stream-browserify', vm: 'vm-browserify' },
//   aliasFields: ['browser'],
// },
