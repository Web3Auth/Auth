export type OriginData = {
  [P in string]: string;
};

export type UserData = {
  [P in string]: string;
};

export declare type ThemeData = {
  [P in string]: string;
};

export declare type WhiteLabelData = {
  [P in string]: string | ThemeData;
};

export type SessionInfo = {
  _pid: string;
  _user: string;
  _userSig: string;
  _userData: UserData;
  _origin: string;
  _originData: OriginData;
  _clientId: string;
  _whiteLabelData: WhiteLabelData;
};
