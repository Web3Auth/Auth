import { WhiteLabelData } from "@toruslabs/openlogin-utils";

const whiteLabel: WhiteLabelData = {
  appName: "HelloDemo",
  appUrl: "http://localhost:8080",
  logoDark: "https://images.web3auth.io/example-hello.svg", // dark logo for light background
  logoLight: "https://images.web3auth.io/example-hello-light.svg", // light logo for dark background
  mode: "auto",
  theme: {
    primary: "#FF9900",
    onPrimary: "black",
  },
};

export default whiteLabel;
