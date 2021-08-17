import OpenLogin from "openlogin";

const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";

const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "development",
  _iframeUrl: "http://localhost:3001",
  loginConfig: {
    custom_jwt: {
      name: "Custom Cognito Openlogin",
      verifier: "torus-cognito-custom",
      /**
       * The type of login. Refer to enum `LOGIN_TYPE`
       */
      typeOfLogin: "custom_jwt",
      clientId: YOUR_PROJECT_ID,
    },
  },
});

export const loginWithOpenlogin = async (idToken: string, verifierId: string) => {
  console.log("loginWithOpenlogin", idToken, verifierId);
  const privKey = await openlogin.login({
    // pass empty string '' as loginProvider to open default torus modal
    // with all default supported login providers or you can pass specific
    // login provider from available list to set as default.
    // for ex: google, facebook, twitter etc
    loginProvider: "custom_jwt",
    customJwtParams: {
      verifierId,
      idToken,
      verifierIdField: "email",
    },
    redirectUrl: `${window.location.origin}/home`,
    relogin: true,
    // setting it true will force user to use touchid/faceid (if available on device)
    // while doing login again
    fastLogin: false,

    // setting skipTKey to true will display a button to user to skip
    // openlogin security while login.
    // But caveat here is that user will be get different keys if user is skipping tkey
    // so use this option with care in your app or make sure user knows about this.
    skipTKey: false,

    // you can pass standard oauth parameter in extralogin options
    // for ex: in case of passwordless login, you have to pass user's email as login_hint
    // and your app domain.
    // extraLoginOptions: {
    //   domain: 'www.yourapp.com',
    //   login_hint: 'hello@yourapp.com',
    // },
    extraLoginOptions: { domain: "http://localhost:3000", verifierIdField: "email" },
  });
  return privKey;
};

export default openlogin;
