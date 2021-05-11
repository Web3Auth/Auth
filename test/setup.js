/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const fetch = require("node-fetch");
require("jsdom-global")("<!doctype html><html><body></body></html>", {
  url: "https://example.com",
});
require("ts-node").register({ project: path.resolve("tsconfig.json"), require: ["tsconfig-paths/register"], transpileOnly: true });

const register = require("@babel/register").default;

register({
  extensions: [".ts", ".js"],
  rootMode: "upward",
});

global.fetch = fetch;
