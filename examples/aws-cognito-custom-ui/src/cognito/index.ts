import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from "amazon-cognito-identity-js";

const userPoolId = process.env.REACT_APP_USERPOOL_ID || "ap-southeast-1_2fuGnyeib";
const clientId = process.env.REACT_APP_CLIENT_ID || "hqhct77454uj63961rcqeu4u7";

console.log(`userpool id=${userPoolId}`);
console.log(`client id=${clientId}`);

const poolData = {
  UserPoolId: `${userPoolId}`,
  ClientId: `${clientId}`,
};

const userPool: CognitoUserPool = new CognitoUserPool(poolData);

let currentUser: any = userPool.getCurrentUser();

export function getCurrentUser() {
  return currentUser;
}

function getCognitoUser(username: string) {
  const userData = {
    Username: username,
    Pool: userPool,
  };
  const cognitoUser = new CognitoUser(userData);

  return cognitoUser;
}

export async function getSession() {
  if (!currentUser) {
    currentUser = userPool.getCurrentUser();
  }

  return new Promise((resolve, reject) => {
    currentUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(session);
      }
    });
  }).catch((err) => {
    throw err;
  });
}

export async function signUpUserWithEmail(email: string, password: string) {
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, [], [], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }).catch((err) => {
    console.log("error", err);
    throw err;
  });
}

export async function verifyCode(username: string, code: string) {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  }).catch((err) => {
    throw err;
  });
}

export async function signInWithEmail(username: string, password: string) {
  return new Promise((resolve, reject) => {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    currentUser = getCognitoUser(username);

    currentUser.authenticateUser(authenticationDetails, {
      onSuccess(res: any) {
        resolve(res);
      },
      onFailure(err: any) {
        reject(err);
      },
    });
  }).catch((err) => {
    throw err;
  });
}

export function signOut() {
  if (currentUser) {
    currentUser.signOut();
  }
}

export async function getAttributes() {
  return new Promise((resolve, reject) => {
    currentUser.getUserAttributes((err: any, attributes: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(attributes);
      }
    });
  }).catch((err) => {
    throw err;
  });
}

export async function setAttribute(attribute: any) {
  return new Promise((resolve, reject) => {
    const attributeList = [];
    const res = new CognitoUserAttribute(attribute);
    attributeList.push(res);

    currentUser.updateAttributes(attributeList, (err: any, resp: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(resp);
      }
    });
  }).catch((err) => {
    throw err;
  });
}

export async function sendCode(username: string) {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    if (!cognitoUser) {
      reject(new Error(`could not find ${username}`));
      return;
    }

    cognitoUser.forgotPassword({
      onSuccess(res) {
        resolve(res);
      },
      onFailure(err) {
        reject(err);
      },
    });
  }).catch((err) => {
    throw err;
  });
}

export async function forgotPassword(username: string, code: string, password: string) {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCognitoUser(username);

    if (!cognitoUser) {
      reject(new Error(`could not find ${username}`));
      return;
    }

    cognitoUser.confirmPassword(code, password, {
      onSuccess() {
        resolve("password updated");
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return new Promise((resolve, reject) => {
    currentUser.changePassword(oldPassword, newPassword, (err: any, res: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
