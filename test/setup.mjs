import register from "@babel/register";

register({
  presets: [["@babel/env", { bugfixes: true }], "@babel/typescript"],
  plugins: [
    "@babel/plugin-syntax-bigint",
    "@babel/plugin-transform-object-rest-spread",
    "@babel/plugin-transform-class-properties",
    ["@babel/transform-runtime"],
    "@babel/plugin-transform-numeric-separator",
  ],
  sourceType: "unambiguous",
  extensions: [".ts", ".js"],
});
