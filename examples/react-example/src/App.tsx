import "./App.css";

import { Auth, AUTH_CONNECTION, getED25519Key, log } from "@web3auth/auth";
import bs58 from "bs58";
import { useEffect, useState } from "react";

const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";
const auth = new Auth({
  clientId: YOUR_PROJECT_ID,
  network: "sapphire_devnet",
  uxMode: "popup",
  redirectUrl: `${window.location.origin}`,
  buildEnv: "development",
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
    const userInfo = auth.getUserInfo();
    printToConsole(userInfo);
  };

  async function login() {
    setLoading(true);
    try {
      await auth.login({
        authConnection: AUTH_CONNECTION.GITHUB,
      });
      if (auth.privKey) {
        await printUserInfo();
      }
      setLoading(false);
    } catch (error) {
      log.error("error", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    async function initializeAuth() {
      try {
        await auth.init();
        if (auth.privKey) {
          await printUserInfo();
        }
      } catch (error) {
        log.error("error while initialization", error);
      } finally {
        setLoading(false);
      }
    }
    initializeAuth();
  }, []);

  const getEd25519Key = async () => {
    const { sk } = getED25519Key(auth.privKey);
    const base58Key = bs58.encode(new Uint8Array(sk));
    printToConsole(base58Key);
  };

  const logout = async () => {
    try {
      setLoading(true);
      await auth.logout();
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
          {!auth.privKey ? (
            <div>
              <h3>Login With Web3Auth</h3>
              <button onClick={login}>login with github</button>
            </div>
          ) : (
            <div>
              <section>
                <div>
                  Private key:
                  <i>{auth.privKey}</i>
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
