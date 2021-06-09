export declare type OriginData = {
    [P in string]: string;
};
export declare type UserData = {
    [P in string]: string;
};
export declare type WhiteLabelData = {
    [P in string]: unknown;
};
export declare type TypeOfLogin = "google" | "facebook" | "reddit" | "discord" | "twitch" | "apple" | "github" | "linkedin" | "twitter" | "weibo" | "line" | "email_password" | "passwordless" | "jwt" | "webauthn";
export declare type LoginConfig = Record<string, {
    verifier: string;
    typeOfLogin: TypeOfLogin;
    name: string;
    description?: string;
    clientId?: string;
    verifierSubIdentifier?: string;
    logoHover?: string;
    logoLight?: string;
    logoDark?: string;
    mainOption?: boolean;
    showOnModal?: boolean;
    showOnDesktop?: boolean;
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
