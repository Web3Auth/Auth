import { TORUS_LEGACY_NETWORK, TORUS_SAPPHIRE_NETWORK } from "@toruslabs/constants";

export const storeKey = "auth_store";
export const WEB3AUTH_LEGACY_NETWORK = TORUS_LEGACY_NETWORK;
export const WEB3AUTH_SAPPHIRE_NETWORK = TORUS_SAPPHIRE_NETWORK;

export const WEB3AUTH_NETWORK = {
  ...WEB3AUTH_SAPPHIRE_NETWORK,
  ...WEB3AUTH_LEGACY_NETWORK,
} as const;

export const SUPPORTED_KEY_CURVES = {
  SECP256K1: "secp256k1",
  ED25519: "ed25519",
  OTHER: "other",
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
  DISPLAY_IFRAME: "display_iframe",
  HIDE_IFRAME: "hide_iframe",
} as const;

export const IFRAME_MODAL_ID = "auth-iframe";
export const POPUP_TIMEOUT = 1000 * 10; // 10 seconds;
