export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

export type WhiteLabelData = {
  name?: string;
  logoLight?: string;
  logoDark?: string;
  defaultLanguage?: string;
  dark?: boolean;
  theme?: {
    [P in string]: string;
  };
};

export type TypeOfLogin =
  | "google"
  | "facebook"
  | "reddit"
  | "discord"
  | "twitch"
  | "apple"
  | "github"
  | "linkedin"
  | "twitter"
  | "weibo"
  | "line"
  | "email_password"
  | "passwordless"
  | "jwt"
  | "webauthn";

export type LoginConfig = Record<
  string,
  {
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
  }
>;

export type SessionInfo = {
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
