import { AUTH_CONNECTION, EMAIL_FLOW } from "@toruslabs/customauth";
import bowser from "bowser";

import {
  APPLE_LOGIN_PROVIDER,
  AUTHENTICATOR_LOGIN_PROVIDER,
  DISCORD_LOGIN_PROVIDER,
  EMAIL_PASSWORDLESS_LOGIN_PROVIDER,
  FACEBOOK_LOGIN_PROVIDER,
  FARCASTER_LOGIN_PROVIDER,
  GITHUB_LOGIN_PROVIDER,
  GOOGLE_LOGIN_PROVIDER,
  KAKAO_LOGIN_PROVIDER,
  LINE_LOGIN_PROVIDER,
  LINKEDIN_LOGIN_PROVIDER,
  PASSKEYS_LOGIN_PROVIDER,
  REDDIT_LOGIN_PROVIDER,
  SMS_PASSWORDLESS_LOGIN_PROVIDER,
  TWITCH_LOGIN_PROVIDER,
  TWITTER_LOGIN_PROVIDER,
  WECHAT_LOGIN_PROVIDER,
} from "../utils";
import browserInfo from "../utils/browserInfo";
import { AuthConnectionConfig, AuthConnectionConfigItem, BUILD_ENV_TYPE, WEB3AUTH_NETWORK_TYPE } from "../utils/interfaces";
import configBuild from "./config-build";
import configEnv from "./config-env";

export const getAuthConnectionConfig = (environment: BUILD_ENV_TYPE, network: WEB3AUTH_NETWORK_TYPE) => {
  const currentConfigEnv = configEnv[network];
  const currentBuildEnv = configBuild[environment];
  if (!currentConfigEnv || !currentBuildEnv) {
    throw new Error("Invalid environment settings");
  }

  return {
    [GOOGLE_LOGIN_PROVIDER]: {
      loginProvider: GOOGLE_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.googleVerifier,
      authConnection: AUTH_CONNECTION.GOOGLE,
      name: GOOGLE_LOGIN_PROVIDER,
      description: "login.verifier-google-desc",
      clientId: currentConfigEnv.googleClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.googleVerifier : "",
      mainOption: true,
      showOnSocialBackupFactor: true,
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletGoogleVerifier,
      jwtParameters: {
        prompt: browserInfo.platform === bowser.PLATFORMS_MAP.desktop ? "select_account" : "consent select_account",
      },
    } as AuthConnectionConfigItem,
    [FACEBOOK_LOGIN_PROVIDER]: {
      loginProvider: FACEBOOK_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.facebookVerifier,
      authConnection: AUTH_CONNECTION.FACEBOOK,
      name: FACEBOOK_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.facebookClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.facebookVerifier : "",
      mainOption: true,
      showOnSocialBackupFactor: true,
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletFacebookVerifier,
    } as AuthConnectionConfigItem,
    [TWITTER_LOGIN_PROVIDER]: {
      loginProvider: TWITTER_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.twitterVerifier,
      authConnection: AUTH_CONNECTION.TWITTER,
      name: TWITTER_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.twitterClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.twitterVerifier : "",
      mainOption: true,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "twitter",
        isUserIdCaseSensitive: false,
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletTwitterVerifier,
    } as AuthConnectionConfigItem,
    [DISCORD_LOGIN_PROVIDER]: {
      loginProvider: DISCORD_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.discordVerifier,
      authConnection: AUTH_CONNECTION.DISCORD,
      name: DISCORD_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.discordClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.discordVerifier : "",
      showOnSocialBackupFactor: true,
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletDiscordVerifier,
    } as AuthConnectionConfigItem,
    [LINE_LOGIN_PROVIDER]: {
      loginProvider: LINE_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.lineVerifier,
      authConnection: AUTH_CONNECTION.LINE,
      name: LINE_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.lineClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.lineVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "line",
        prompt: "consent",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletLineVerifier,
    } as AuthConnectionConfigItem,
    [REDDIT_LOGIN_PROVIDER]: {
      loginProvider: REDDIT_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.redditVerifier,
      authConnection: AUTH_CONNECTION.REDDIT,
      name: REDDIT_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.redditClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.redditVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        userIdField: "name",
        connection: "Reddit",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletRedditVerifier,
    } as AuthConnectionConfigItem,
    [APPLE_LOGIN_PROVIDER]: {
      loginProvider: APPLE_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.appleVerifier,
      authConnection: AUTH_CONNECTION.APPLE,
      name: APPLE_LOGIN_PROVIDER,
      description: "",
      clientId: currentConfigEnv.appleClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.appleVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "apple",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletAppleVerifier,
    } as AuthConnectionConfigItem,
    [GITHUB_LOGIN_PROVIDER]: {
      loginProvider: GITHUB_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.githubVerifier,
      authConnection: AUTH_CONNECTION.GITHUB,
      description: "",
      name: GITHUB_LOGIN_PROVIDER,
      clientId: currentConfigEnv.githubClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.githubVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "github",
        isUserIdCaseSensitive: false,
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletGithubVerifier,
    } as AuthConnectionConfigItem,
    [TWITCH_LOGIN_PROVIDER]: {
      loginProvider: TWITCH_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.twitchVerifier,
      authConnection: AUTH_CONNECTION.TWITCH,
      description: "",
      name: TWITCH_LOGIN_PROVIDER,
      clientId: currentConfigEnv.twitchClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.twitchVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletTwitchVerifier,
    } as AuthConnectionConfigItem,
    [LINKEDIN_LOGIN_PROVIDER]: {
      loginProvider: LINKEDIN_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.linkedinVerifier,
      authConnection: AUTH_CONNECTION.LINKEDIN,
      description: "",
      name: LINKEDIN_LOGIN_PROVIDER,
      clientId: currentConfigEnv.linkedinClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.linkedinVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "linkedin",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletLinkedinVerifier,
    } as AuthConnectionConfigItem,
    [WECHAT_LOGIN_PROVIDER]: {
      loginProvider: WECHAT_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.wechatVerifier,
      authConnection: AUTH_CONNECTION.CUSTOM,
      description: "",
      name: "WeChat",
      clientId: currentConfigEnv.wechatClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.wechatVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "Wechat",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletWechatVerifier,
    } as AuthConnectionConfigItem,
    [KAKAO_LOGIN_PROVIDER]: {
      loginProvider: KAKAO_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.kakaoVerifier,
      authConnection: AUTH_CONNECTION.CUSTOM,
      description: "",
      name: "Kakao",
      clientId: currentConfigEnv.kakaoClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.kakaoVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.loginDomain,
        connection: "Kakao",
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: currentConfigEnv.walletKakaoVerifier,
    } as AuthConnectionConfigItem,
    [EMAIL_PASSWORDLESS_LOGIN_PROVIDER]: {
      loginProvider: EMAIL_PASSWORDLESS_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedEmailPasswordlessVerifier,
      description: "login.verifier-email-desc",
      authConnection: AUTH_CONNECTION.EMAIL_PASSWORDLESS,
      name: "email",
      clientId: currentConfigEnv.hostedEmailPasswordlessClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedEmailPasswordlessVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        isUserIdCaseSensitive: false,
        flow_type: EMAIL_FLOW.code,
      },
      // For torus only
      buttonDescription: "Sign up/in with Email",
      walletAuthConnectionId: currentConfigEnv.walletHostedEmailPasswordlessVerifier,
    } as AuthConnectionConfigItem,
    [SMS_PASSWORDLESS_LOGIN_PROVIDER]: {
      loginProvider: SMS_PASSWORDLESS_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedSmsPasswordlessVerifier,
      description: "login.verifier-sms-desc-2",
      authConnection: AUTH_CONNECTION.SMS_PASSWORDLESS,
      name: "mobile",
      clientId: currentConfigEnv.hostedSmsPasswordlessClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedSmsPasswordlessVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        isUserIdCaseSensitive: false,
      },

      // for torus only.
      buttonDescription: "Sign up/in with Mobile",
      walletAuthConnectionId: currentConfigEnv.walletHostedSmsPasswordlessVerifier,
    } as AuthConnectionConfigItem,
    [PASSKEYS_LOGIN_PROVIDER]: {
      loginProvider: PASSKEYS_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.passkeysVerifier,
      description: "login.verifier-webauth-desc",
      authConnection: AUTH_CONNECTION.PASSKEYS,
      name: "passkey",
      clientId: currentConfigEnv.passkeysClientId,
      mainOption: false,
      showOnSocialBackupFactor: false,
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
    [FARCASTER_LOGIN_PROVIDER]: {
      loginProvider: FARCASTER_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.hostedFarcasterVerifier,
      description: "",
      authConnection: AUTH_CONNECTION.CUSTOM,
      name: "Farcaster",
      clientId: currentConfigEnv.hostedFarcasterClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.hostedFarcasterVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: true,
      jwtParameters: {
        domain: currentConfigEnv.farcasterLoginDomain,
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
    [AUTHENTICATOR_LOGIN_PROVIDER]: {
      loginProvider: AUTHENTICATOR_LOGIN_PROVIDER,
      authConnectionId: currentConfigEnv.verifierSubIdentifier || currentConfigEnv.authenticatorVerifier,
      description: "",
      authConnection: AUTH_CONNECTION.CUSTOM,
      name: "Authenticator",
      clientId: currentConfigEnv.authenticatorClientId,
      groupedAuthConnectionId: currentConfigEnv.verifierSubIdentifier ? currentConfigEnv.authenticatorVerifier : "",
      mainOption: false,
      showOnSocialBackupFactor: false,
      jwtParameters: {
        domain: currentBuildEnv.passwordlessHost,
        userIdField: "name",
        connection: "authenticator",
        isUserIdCaseSensitive: false,
        network,
      },
      // For torus only
      buttonDescription: "",
      walletAuthConnectionId: "",
    } as AuthConnectionConfigItem,
  } as AuthConnectionConfig;
};
