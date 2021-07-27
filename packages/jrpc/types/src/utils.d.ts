export declare type OriginData = {
    [P in string]: string;
};
export declare type UserData = {
    [P in string]: string;
};
export declare type WhiteLabelData = {
    /**
     * App name to display in the UI
     */
    name?: string;
    /**
     * App logo to use in light mode
     */
    logoLight?: string;
    /**
     * App logo to use in dark mode
     */
    logoDark?: string;
    /**
     * Default language to use
     *
     * @defaultValue en
     */
    defaultLanguage?: string;
    /**
     * Whether to enable dark mode
     *
     * @defaultValue false
     */
    dark?: boolean;
    /**
     * Used to customize theme of the login modal with following options
     * `'primary'` - To customize primary color of modal's content.
     */
    theme?: {
        [P in string]: string;
    };
};
export declare type TypeOfLogin = "google" | "facebook" | "reddit" | "discord" | "twitch" | "apple" | "github" | "linkedin" | "twitter" | "weibo" | "line" | "email_password" | "passwordless" | "jwt" | "webauthn";
export declare type LoginConfig = Record<string, {
    verifier: string;
    /**
     * The type of login. Refer to enum `LOGIN_TYPE`
     */
    typeOfLogin: TypeOfLogin;
    /**
     * Display Name. If not provided, we use the default for openlogin app
     */
    name: string;
    /**
     * Description for button. If provided, it renders as a full length button. else, icon button
     */
    description?: string;
    /**
     * Custom client_id. If not provided, we use the default for openlogin app
     */
    clientId?: string;
    verifierSubIdentifier?: string;
    /**
     * Logo to be shown on mouse hover. If not provided, we use the default for openlogin app
     */
    logoHover?: string;
    /**
     * Logo to be shown on dark background (dark theme). If not provided, we use the default for openlogin app
     */
    logoLight?: string;
    /**
     * Logo to be shown on light background (light theme). If not provided, we use the default for openlogin app
     */
    logoDark?: string;
    /**
     * Show login button on the main list
     */
    mainOption?: boolean;
    /**
     * Whether to show the login button on modal or not
     */
    showOnModal?: boolean;
    /**
     * Whether to show the login button on desktop
     */
    showOnDesktop?: boolean;
    /**
     * Whether to show the login button on mobile
     */
    showOnMobile?: boolean;
}>;
export declare type SessionInfo = {
    _pid: string;
    _user: string;
    _userSig: string;
    _userData: UserData;
    _origin: string;
    _originData: OriginData;
    _clientId: string;
    _whiteLabelData?: WhiteLabelData;
    _loginConfig: LoginConfig;
};
