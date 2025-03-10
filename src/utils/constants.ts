import { TORUS_LEGACY_NETWORK, TORUS_SAPPHIRE_NETWORK } from "@toruslabs/constants";

export const storeKey = "auth_store";
export const WEB3AUTH_LEGACY_NETWORK = TORUS_LEGACY_NETWORK;
export const WEB3AUTH_SAPPHIRE_NETWORK = TORUS_SAPPHIRE_NETWORK;

export const UX_MODE = {
  POPUP: "popup",
  REDIRECT: "redirect",
} as const;

export const WEB3AUTH_NETWORK = {
  ...WEB3AUTH_SAPPHIRE_NETWORK,
  ...WEB3AUTH_LEGACY_NETWORK,
} as const;

export const SUPPORTED_KEY_CURVES = {
  SECP256K1: "secp256k1",
  ED25519: "ed25519",
  OTHER: "other",
} as const;

export const LOGIN_PROVIDER = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  REDDIT: "reddit",
  DISCORD: "discord",
  TWITCH: "twitch",
  APPLE: "apple",
  LINE: "line",
  GITHUB: "github",
  KAKAO: "kakao",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
  WEIBO: "weibo",
  WECHAT: "wechat",
  FARCASTER: "farcaster",
  EMAIL_PASSWORDLESS: "email_passwordless",
  SMS_PASSWORDLESS: "sms_passwordless",
  WEBAUTHN: "webauthn",
  JWT: "jwt",
  PASSKEYS: "passkeys",
  AUTHENTICATOR: "authenticator",
} as const;

export const MFA_LEVELS = {
  DEFAULT: "default",
  OPTIONAL: "optional",
  MANDATORY: "mandatory",
  NONE: "none",
} as const;

export const AUTH_ACTIONS = {
  LOGIN: "login",
  ENABLE_MFA: "enable_mfa",
  MANAGE_MFA: "manage_mfa",
  ADD_SOCIAL_FACTOR: "add_social_factor",
  MODIFY_SOCIAL_FACTOR: "modify_social_factor",
  ADD_AUTHENTICATOR_FACTOR: "add_authenticator_factor",
  ADD_PASSKEY_FACTOR: "add_passkey_factor",
} as const;

export const BUILD_ENV = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  STAGING: "staging",
  TESTING: "testing",
} as const;

export const SDK_MODE = {
  DEFAULT: "default",
  IFRAME: "iframe",
} as const;

export const JRPC_METHODS = {
  INIT_DAPP: "init_dapp",
  LOGIN_INITIATED: "login_initiated",
  LOGIN_CANCELLED: "login_cancelled",
  LOGIN_FAILED: "login_failed",
  LOGIN_SUCCESS: "login_success",
} as const;

// Passwordless backend service
export const PASSWORDLESS_SERVER_API_URL = "https://api.web3auth.io/passwordless-service";
export const PASSWORDLESS_SERVER_SOCKET_URL = "https://api-passwordless.web3auth.io";
export const DEVELOP_PASSWORDLESS_SERVER_API_URL = "https://api-develop.web3auth.io/passwordless-service";
export const DEVELOP_PASSWORDLESS_SERVER_SOCKET_URL = "https://api-develop-passwordless.web3auth.io";

// Auth backend service
export const AUTH_SERVER_URL = "https://api.web3auth.io/auth-service";
export const DEVELOP_AUTH_SERVER_URL = "https://api-develop.web3auth.io/auth-service";

export const IFRAME_MODAL_ID = "auth-iframe";

export const GOOGLE = "google";
export const FACEBOOK = "facebook";
export const REDDIT = "reddit";
export const DISCORD = "discord";
export const TWITCH = "twitch";
export const APPLE = "apple";
export const LINE = "line";
export const GITHUB = "github";
export const LINKEDIN = "linkedin";
export const TWITTER = "twitter";
export const WEIBO = "weibo";
export const JWT = "jwt";
export const PASSKEYS = "passkeys";

export const GOOGLE_LOGIN_PROVIDER = "google";
export const FACEBOOK_LOGIN_PROVIDER = "facebook";
export const REDDIT_LOGIN_PROVIDER = "reddit";
export const DISCORD_LOGIN_PROVIDER = "discord";
export const TWITCH_LOGIN_PROVIDER = "twitch";
export const APPLE_LOGIN_PROVIDER = "apple";
export const LINE_LOGIN_PROVIDER = "line";
export const GITHUB_LOGIN_PROVIDER = "github";
export const KAKAO_LOGIN_PROVIDER = "kakao";
export const LINKEDIN_LOGIN_PROVIDER = "linkedin";
export const TWITTER_LOGIN_PROVIDER = "twitter";
export const WEIBO_LOGIN_PROVIDER = "weibo";
export const WECHAT_LOGIN_PROVIDER = "wechat";
export const EMAIL_PASSWORDLESS_LOGIN_PROVIDER = "email_passwordless";
export const FARCASTER_LOGIN_PROVIDER = "farcaster";
export const AUTHENTICATOR_LOGIN_PROVIDER = "authenticator";
export const SMS_PASSWORDLESS_LOGIN_PROVIDER = "sms_passwordless";
export const PASSKEYS_LOGIN_PROVIDER = "passkeys";
