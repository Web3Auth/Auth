import { AUTH_CONNECTION, AuthConnectionConfigItem } from "@web3auth/auth";

export default [
  {
    authConnection: AUTH_CONNECTION.GOOGLE,
    name: "Google Login",
    description: "Login with Custom Google",
    authConnectionId: "lionell-google-test-1",
    clientId: "1096850687771-bmol268h2346u82au58o5g056t2tl84v.apps.googleusercontent.com",
    mainOption: true,
    logoDark: "https://images.web3auth.io/example-login-hello-dark.svg",
    logoLight: "https://images.web3auth.io/example-login-hello-light.svg",
    logoHover: "https://images.web3auth.io/example-login-hello-hover.svg",
  } as AuthConnectionConfigItem,
];
