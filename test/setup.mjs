import register from "@babel/register";
import path from "path";
import { register as tsRegister } from "ts-node";

tsRegister({ project: path.resolve("tsconfig.json") });

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
