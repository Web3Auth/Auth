/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState, useEffect, useContext } from "react";

import * as cognito from "../cognito";

export enum AuthStatus {
  Loading,
  SignedIn,
  SignedOut,
}

export interface IAuth {
  sessionInfo: {
    username?: string;
    email?: string;
    sub?: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  };
  privateKey?: string;
  attrInfo?: any;
  authStatus?: AuthStatus;
  signInWithEmail?: any;
  signUpWithEmail?: any;
  signOut?: any;
  verifyCode?: any;
  getSession?: any;
  sendCode?: any;
  forgotPassword?: any;
  changePassword?: any;
  getAttributes?: any;
  setAttribute?: any;
  setSessionInfo?: any;
  setOpenloginKey?: any;
}

const defaultState: IAuth = {
  sessionInfo: {},
  authStatus: AuthStatus.Loading,
};

export const AuthContext = React.createContext(defaultState);

export const AuthIsSignedIn: React.FunctionComponent = ({ children }) => {
  const { authStatus }: IAuth = useContext(AuthContext);

  return <>{authStatus === AuthStatus.SignedIn ? children : null}</>;
};

export const AuthIsNotSignedIn: React.FunctionComponent = ({ children }) => {
  const { authStatus }: IAuth = useContext(AuthContext);

  return <>{authStatus === AuthStatus.SignedOut ? children : null}</>;
};

const AuthProvider: React.FunctionComponent = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(AuthStatus.Loading);
  const [sessionInfo, setSessionInfo] = useState({});
  const [attrInfo, setAttrInfo] = useState([]);
  const [privateKey, setOpenloginKey] = useState("");

  useEffect(() => {
    async function getSessionInfo() {
      try {
        const session: any = await getSession();
        console.log("session", session);
        setSessionInfo({
          accessToken: session.accessToken.jwtToken,
          refreshToken: session.refreshToken.token,
          idToken: session.idToken.jwtToken,
          email: session.idToken.payload.email,
        });
        window.localStorage.setItem("accessToken", `${session.accessToken.jwtToken}`);
        window.localStorage.setItem("refreshToken", `${session.refreshToken.token}`);
        const attr: any = await getAttributes();
        setAttrInfo(attr);
        setAuthStatus(AuthStatus.SignedIn);
      } catch (err) {
        setAuthStatus(AuthStatus.SignedOut);
      }
    }
    getSessionInfo();
  }, [setAuthStatus, authStatus]);

  if (authStatus === AuthStatus.Loading) {
    return null;
  }

  async function signInWithEmail(username: string, password: string) {
    try {
      await cognito.signInWithEmail(username, password);
      setAuthStatus(AuthStatus.SignedIn);
    } catch (err) {
      setAuthStatus(AuthStatus.SignedOut);
      throw err;
    }
  }

  async function signUpWithEmail(username: string, email: string, password: string) {
    await cognito.signUpUserWithEmail(username, email, password);
  }

  function signOut() {
    cognito.signOut();
    setAuthStatus(AuthStatus.SignedOut);
  }

  async function verifyCode(username: string, code: string) {
    await cognito.verifyCode(username, code);
  }

  async function getSession() {
    const session = await cognito.getSession();
    return session;
  }

  async function getAttributes() {
    const attr = await cognito.getAttributes();
    return attr;
  }

  async function setAttribute(attr: any) {
    const res = await cognito.setAttribute(attr);
    return res;
  }

  async function sendCode(username: string) {
    await cognito.sendCode(username);
  }

  async function forgotPassword(username: string, code: string, password: string) {
    await cognito.forgotPassword(username, code, password);
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await cognito.changePassword(oldPassword, newPassword);
  }

  const state: IAuth = {
    authStatus,
    sessionInfo,
    privateKey,
    attrInfo,
    setOpenloginKey,
    signUpWithEmail,
    signInWithEmail,
    setSessionInfo,
    signOut,
    verifyCode,
    getSession,
    sendCode,
    forgotPassword,
    changePassword,
    getAttributes,
    setAttribute,
  };

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
