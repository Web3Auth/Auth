import Register from "@babel/register";

Register({
  extensions: [".ts", ".js"],
  rootMode: "upward",
});
