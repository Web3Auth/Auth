import { WhiteLabelData } from "@toruslabs/openlogin-utils";

export default {
  name: "HelloDemo",
  appUrl: "http://localhost:8080",
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  theme: {
    primary: "#FF9900",
  },
} as WhiteLabelData;
