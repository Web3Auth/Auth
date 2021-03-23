export declare type OriginData = {
    [P in string]: string;
};
export declare type UserData = {
    [P in string]: string;
};
export declare type SessionInfo = {
    _pid: string;
    _user: string;
    _userSig: string;
    _userData: UserData;
    _origin: string;
    _originData: OriginData;
    _clientId: string;
};
