import "./App.css";
import OpenLogin from "openlogin";
import { useEffect, useState } from "react";
import * as bs58 from "bs58";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";

const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";

const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "testnet",
  // _iframeUrl: "http://localhost:3000",
  // you can pass login config to modify default
  // login options in login modal, also you can pass
  // your own verifiers.
  loginConfig: {
    google: {
      verifier: "tkey-google-lrc",
      name: "google",
      typeOfLogin: "google",
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
    },
    facebook: {
      verifier: "tkey-facebook-lrc",
      name: "facebook",
      typeOfLogin: "facebook",
      showOnModal: true,
      showOnDesktop: false,
      showOnMobile: true,
      mainOption: true,
      description: "facebook social login",
    },
    // twitter: {
    //   verifier: "YOUR_CUSTOM_VERIFIER",
    //   name: "facebook",
    //   typeOfLogin: "facebook",
    //   showOnModal: true,
    //   showOnDesktop: true,
    //   showOnMobile: false,
    //   mainOption: true,
    //   description: "any description",
    // },
  },
});
function App() {
  const [loading, setLoading] = useState(false);
  const printToConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };

  const printUserInfo = async () => {
    const userInfo = await openlogin.getUserInfo();
    printToConsole(userInfo);
  };

  async function login() {
    setLoading(true);
    try {
      const privKey = await openlogin.login({
        // pass empty string '' as loginProvider to open default torus modal
        // with all default supported login providers or you can pass specific
        // login provider from available list to set as default.
        // for ex: google, facebook, twitter etc
        loginProvider: "",
        redirectUrl: `${window.location.origin}`,
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
      });
      if (privKey && typeof privKey === "string") {
        await printUserInfo();
      }

      setLoading(false);
    } catch (error) {
      console.log("error", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    async function initializeOpenlogin() {
      try {
        await openlogin.init();
        if (openlogin.privKey) {
          await printUserInfo();
        }
        setLoading(false);
      } catch (error) {
        console.log("error while initialization", error);
      } finally {
        setLoading(false);
      }
    }
    initializeOpenlogin();
  }, []);

  const getEd25519Key = async () => {
    const { sk } = getED25519Key(openlogin.privKey);
    const base58Key = bs58.encode(sk);
    printToConsole(base58Key);
  };

  const logout = async () => {
    try {
      setLoading(true);
      await openlogin.logout({});
    } catch (error) {
      printToConsole("error while logout", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              margin: 20,
            }}
          >
            <h1>....loading</h1>
          </div>
        </div>
      ) : (
        <div className="App">
          {!openlogin.privKey ? (
            <div>
              <h3>Login With Openlogin</h3>
              <button onClick={login}>login</button>
            </div>
          ) : (
            <div>
              <section>
                <div>
                  Private key:
                  <i>{openlogin.privKey}</i>
                  <button onClick={() => logout()}>Logout</button>
                </div>
                <div>
                  <button onClick={printUserInfo}>Get User Info</button>
                  <button onClick={getEd25519Key}>Get Ed25519Key </button>

                  <div id="console" style={{ whiteSpace: "pre-line" }}>
                    <p style={{ whiteSpace: "pre-line" }} />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
