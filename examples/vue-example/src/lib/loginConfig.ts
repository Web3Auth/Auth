import { LoginConfig } from "@toruslabs/openlogin-jrpc";
import { LOGIN_PROVIDER } from "openlogin";

export default {
  email_password: {
    loginProvider: "email_password",
    name: "Binance Login",
    typeOfLogin: LOGIN_PROVIDER.JWT,
    description: "Login with Auth0",
    verifier: "lioneell-auth0-email-password",
    clientId: "MfPdpVU82zbowrP1zefQg7mCCdXzENTG",
    showOnModal: true,
    showOnDesktop: true,
    showOnMobile: true,
    mainOption: true,
    verifierSubIdentifier: "",
    // logoDark: "https://images.web3auth.io/example-login-hello-dark.svg",
    // logoLight: "https://images.web3auth.io/example-login-hello-light.svg",
    // logoHover: "https://images.web3auth.io/example-login-hello-hover.svg",
    jwtParameters: {
      domain: "https://dev-zraq1p5o.us.auth0.com",
      connection: "Username-Password-Authentication",
    },
  } as LoginConfig[keyof LoginConfig],
};
