export const GOOGLE = "google";
export const FACEBOOK = "facebook";
export const REDDIT = "reddit";
export const DISCORD = "discord";
export const TWITCH = "twitch";
export const GITHUB = "github";
export const APPLE = "apple";
export const LINKEDIN = "linkedin";
export const TWITTER = "twitter";
export const WEIBO = "weibo";
export const LINE = "line";
export const EMAIL_PASSWORD = "email_password";
export const PASSWORDLESS = "passwordless";
export const HOSTED_EMAIL_PASSWORDLESS = "hosted_email_passwordless";
export const HOSTED_SMS_PASSWORDLESS = "hosted_sms_passwordless";
export const WEBAUTHN = "webauthn";
export const COGNITO = "cognito";
export const AUTH_DOMAIN = "https://torus-test.auth0.com";
export const COGNITO_AUTH_DOMAIN = "https://torus-test.auth.ap-southeast-1.amazoncognito.com/oauth2/";
export const TORUS_EMAIL_PASSWORDLESS = "torus_email_passwordless";
export const TORUS_SMS_PASSWORDLESS = "torus_sms_passwordless";

export const verifierMap = {
  [GOOGLE]: {
    name: "Google",
    typeOfLogin: "google",
    clientId: "221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com",
    verifier: "google-lrc",
  },
  [FACEBOOK]: { name: "Facebook", typeOfLogin: "facebook", clientId: "617201755556395", verifier: "facebook-lrc" },
  [REDDIT]: { name: "Reddit", typeOfLogin: "jwt", clientId: "RKlRuuRoDKOItbJSoOZabDLzizvd1uKn", verifier: "torus-reddit-test" },
  [TWITCH]: { name: "Twitch", typeOfLogin: "twitch", clientId: "f5and8beke76mzutmics0zu4gw10dj", verifier: "twitch-lrc" },
  [DISCORD]: { name: "Discord", typeOfLogin: "discord", clientId: "682533837464666198", verifier: "discord-lrc" },
  [EMAIL_PASSWORD]: {
    name: "Email Password",
    typeOfLogin: "email_password",
    clientId: "sqKRBVSdwa4WLkaq419U7Bamlh5vK1H7",
    verifier: "torus-auth0-email-password",
  },
  [APPLE]: { name: "Apple", typeOfLogin: "apple", clientId: "m1Q0gvDfOyZsJCZ3cucSQEe9XMvl9d9L", verifier: "torus-auth0-apple-lrc" },
  [GITHUB]: { name: "Github", typeOfLogin: "github", clientId: "PC2a4tfNRvXbT48t89J5am0oFM21Nxff", verifier: "torus-auth0-github-lrc" },
  [LINKEDIN]: { name: "Linkedin", typeOfLogin: "linkedin", clientId: "59YxSgx79Vl3Wi7tQUBqQTRTxWroTuoc", verifier: "torus-auth0-linkedin-lrc" },
  [TWITTER]: { name: "Twitter", typeOfLogin: "twitter", clientId: "A7H8kkcmyFRlusJQ9dZiqBLraG2yWIsO", verifier: "torus-auth0-twitter-lrc" },
  [WEIBO]: { name: "Weibo", typeOfLogin: "weibo", clientId: "dhFGlWQMoACOI5oS5A1jFglp772OAWr1", verifier: "torus-auth0-weibo-lrc" },
  [LINE]: { name: "Line", typeOfLogin: "line", clientId: "WN8bOmXKNRH1Gs8k475glfBP5gDZr9H1", verifier: "torus-auth0-line-lrc" },
  [HOSTED_EMAIL_PASSWORDLESS]: {
    name: "Hosted Email Passwordless",
    typeOfLogin: "jwt",
    clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    verifier: "torus-auth0-passwordless",
  },
  [HOSTED_SMS_PASSWORDLESS]: {
    name: "Hosted SMS Passwordless",
    typeOfLogin: "jwt",
    clientId: "nSYBFalV2b1MSg5b2raWqHl63tfH3KQa",
    verifier: "torus-auth0-sms-passwordless",
  },
  [WEBAUTHN]: { name: "WebAuthn", typeOfLogin: "webauthn", clientId: "webauthn", verifier: "webauthn-lrc" },
  [COGNITO]: {
    name: "Cognito",
    typeOfLogin: "jwt",
    clientId: "78i338ev9lkgjst3mfeuih9tsh",
    verifier: "demo-cognito-example",
  },
  [TORUS_EMAIL_PASSWORDLESS]: {
    name: "Torus Email Passwordless",
    typeOfLogin: "jwt",
    clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    verifier: "torus-auth0-email-passwordless-lrc",
  },
  [TORUS_SMS_PASSWORDLESS]: {
    name: "Torus Sms Passwordless",
    typeOfLogin: "jwt",
    clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    verifier: "torus-sms-passwordless-lrc",
  },
} as Record<string, any>;
