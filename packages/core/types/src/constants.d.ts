import { LoginConfig, OriginData, WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import { ExtraLoginOptions } from "@toruslabs/openlogin-utils";
export declare const iframeDOMElementID = "openlogin-iframe";
export declare const modalDOMElementID = "openlogin-modal";
export declare const storeKey = "openlogin_store";
export declare type PopupResponse<T> = {
    pid: string;
    data: T;
};
export declare type Maybe<T> = Partial<T> | null | undefined;
export declare const UX_MODE: {
    readonly POPUP: "popup";
    readonly REDIRECT: "redirect";
};
export declare type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];
export declare const OPENLOGIN_METHOD: {
    readonly LOGIN: "openlogin_login";
    readonly LOGOUT: "openlogin_logout";
    readonly CHECK_3PC_SUPPORT: "openlogin_check_3PC_support";
    readonly SET_PID_DATA: "openlogin_set_pid_data";
    readonly GET_DATA: "openlogin_get_data";
};
export declare type CUSTOM_OPENLOGIN_METHOD_TYPE = string & {
    toString?: (radix?: number) => string;
};
export declare type OPENLOGIN_METHOD_TYPE = typeof OPENLOGIN_METHOD[keyof typeof OPENLOGIN_METHOD];
export declare const ALLOWED_INTERACTIONS: {
    readonly POPUP: "popup";
    readonly REDIRECT: "redirect";
    readonly JRPC: "jrpc";
};
export declare type ALLOWED_INTERACTIONS_TYPE = typeof ALLOWED_INTERACTIONS[keyof typeof ALLOWED_INTERACTIONS];
export declare type RequestParams = {
    startUrl?: string;
    popupUrl?: string;
    method: OPENLOGIN_METHOD_TYPE | CUSTOM_OPENLOGIN_METHOD_TYPE;
    params: Record<string, unknown>[];
    allowedInteractions: ALLOWED_INTERACTIONS_TYPE[];
};
export declare type BaseLogoutParams = {
    /**
     * You can get your clientId/projectId by registering your
     * dapp on {@link "https://developer.tor.us"| developer dashbaord}
     */
    clientId: string;
    /**
     * Setting fastLogin to `true` will disable fast login for the user on this dapp.
     *
     * Defaults to false
     * @defaultValue false
     * @experimental
     *
     * @remarks
     * Use this option with caution only when you are sure that you wish to disable fast login for the user on this dapp.
     * In general you may not need to use this option.
     */
    fastLogin: boolean;
};
export declare type BaseRedirectParams = {
    /**
     * redirectUrl is the dapp's url where user will be redirected after login.
     *
     * @remarks
     * Register this url at {@link "https://developer.tor.us"| developer dashbaord}
     * else initialization will give error.
     */
    redirectUrl?: string;
    /**
     * Any custom state you wish to pass along. This will be returned to you post redirect.
     * Use this to store data that you want to be available to the dapp after login.
     */
    appState?: string;
};
export declare const OPENLOGIN_NETWORK: {
    readonly MAINNET: "mainnet";
    readonly TESTNET: "testnet";
    readonly DEVELOPMENT: "development";
};
export declare type OPENLOGIN_NETWORK_TYPE = typeof OPENLOGIN_NETWORK[keyof typeof OPENLOGIN_NETWORK];
export declare type OpenLoginOptions = {
    /**
     * You can get your clientId/projectId by registering your
     * dapp on {@link "https://developer.tor.us"| developer dashbaord}
     */
    clientId: string;
    /**
     * network specifies the openlogin iframe url url to be used.
     *
     * - `'mainnet'`: https://app.openlogin.com will be used which is the production version.
     * - `'testnet'`: https://beta.openlogin.com will be used which is the beta version.
     * - `'development'`: http://localhost:3000 will be used for development purpose.
     */
    network: OPENLOGIN_NETWORK_TYPE;
    /**
     * Setting no3PC forces openlogin to assume that third party cookies are blocked
     * in the browser.
     *
     * @defaultValue false
     * @remarks
     * Only pass no3PC to `true` when you are sure that third party cookies are not
     * supported. By default openlogin will self check third party cookies and proceed
     * accordingly.
     */
    no3PC?: boolean;
    /**
     * redirectUrl is the dapp's url where user will be redirected after login.
     *
     * @remarks
     * Register this url at {@link "https://developer.tor.us"| developer dashbaord}
     * else initialization will give error.
     */
    redirectUrl?: string;
    /**
     * two uxModes are supported:-
     * - `'POPUP'`: In this uxMode, a popup will be shown to user for login.
     * - `'REDIRECT'`: In this uxMode, user will be redirected to a new window tab for login.
     *
     * @defaultValue `'POPUP'`
     * @remarks
     *
     * Use of `'REDIRECT'` mode is recommended in browsers where popups might get blocked.
     */
    uxMode?: UX_MODE_TYPE;
    /**
     * replaceUrlOnRedirect removes the params from the redirected url after login
     *
     * @defaultValue true
     */
    replaceUrlOnRedirect?: boolean;
    /**
     * originData is used to verify the origin of dapp by iframe.
     *
     * @internal
     * @remarks
     * You don't have to pass originData explicitly if you have registered your dapp at
     * {@link "https://developer.tor.us"| developer dashbaord}.
     *
     * originData contains a signature of dapp's origin url which is generated using
     * project's secret.
     */
    originData?: OriginData;
    /**
     * loginConfig enables you to pass your own login verifiers configuration for various
     * loginProviders.
     *
     * loginConfig is key value map where each key should be a valid loginProvider and value
     * should be custom configuration for that loginProvider
     *
     * @remarks
     * You can deploy your own verifiers from {@link "https://developer.tor.us"| developer dashbaord}
     * to use here.
     *
     */
    loginConfig?: LoginConfig;
    /**
     * _iframeUrl is for internal development use only and is used to override the
     * `network` parameter.
     * @internal
     */
    _iframeUrl?: string;
    /**
     * _startUrl is for internal development use only and is used specify authentication
     * start url of iframe.
     * @internal
     */
    _startUrl?: string;
    /**
     * _popupUrl is for internal development use only and is used specify url of popup window
     * for popup uxMode.
     * @internal
     */
    _popupUrl?: string;
    /**
     * options for whitelabling default openlogin modal.
     */
    whiteLabel?: WhiteLabelData;
};
export declare const LOGIN_PROVIDER: {
    readonly GOOGLE: "google";
    readonly FACEBOOK: "facebook";
    readonly REDDIT: "reddit";
    readonly DISCORD: "discord";
    readonly TWITCH: "twitch";
    readonly APPLE: "apple";
    readonly LINE: "line";
    readonly GITHUB: "github";
    readonly KAKAO: "kakao";
    readonly LINKEDIN: "linkedin";
    readonly TWITTER: "twitter";
    readonly WEIBO: "weibo";
    readonly WECHAT: "wechat";
    readonly EMAIL_PASSWORDLESS: "email_passwordless";
    readonly WEBAUTHN: "webauthn";
    readonly JWT: "jwt";
};
/**
 * {@label loginProviderType}
 */
export declare type LOGIN_PROVIDER_TYPE = typeof LOGIN_PROVIDER[keyof typeof LOGIN_PROVIDER];
export declare type CUSTOM_LOGIN_PROVIDER_TYPE = string & {
    toString?: (radix?: number) => string;
};
export declare type LoginParams = BaseRedirectParams & {
    /**
     * loginProvider sets the oauth login method to be used.
     * You can use any of the valid loginProvider from the supported list.
     *
     * If this param is not passed then it will show all the available
     * login methods to user in a modal.
     *
     */
    loginProvider?: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
    /**
     * Setting fastLogin to `true` will force user to login with webauthn if
     * webauthn is available on device.
     *
     * Defaults to false
     * @defaultValue false
     * @experimental
     *
     * @remarks
     * Use this option with caution only when you are sure about that user has
     * enabled webauthn while registration, else don't use this option.
     * Openlogin will itself take care of detecting and handling webauthn.
     * In general you may not need to use this option.
     */
    fastLogin?: boolean;
    /**
     * Setting relogin to `true` will force user to relogin when login
     * method is called even if user is already logged in. By default login
     * method call skips login process if user is already logged in.
     *
     * * Defaults to false
     * @defaultValue false
     */
    relogin?: boolean;
    /**
     * setting skipTKey to `true` will skip TKey onboarding for new users,
     * whereas old users  will be presented with an option to skip tKey in UI
     * if this option is enabled.
     *
     * Defaults to false
     * @defaultValue false
     */
    skipTKey?: boolean;
    /**
     * This option is for internal use only in torus wallet and has not effect
     * on user's login on other dapps.
     *
     * Defaults to false
     * @defaultValue false
     * @internal
     */
    getWalletKey?: boolean;
    /**
     * extraLoginOptions can be used to pass standard oauth login options to
     * loginProvider.
     *
     * For ex: you will have to pass `login_hint` as user's email and `domain`
     * as your app domain in `extraLoginOptions` while using `email_passwordless`
     * loginProvider
     */
    extraLoginOptions?: ExtraLoginOptions;
};
export declare type OpenloginUserInfo = {
    email: string;
    name: string;
    profileImage: string;
    aggregateVerifier: string;
    verifier: string;
    verifierId: string;
    typeOfLogin: LOGIN_PROVIDER_TYPE | CUSTOM_LOGIN_PROVIDER_TYPE;
};
