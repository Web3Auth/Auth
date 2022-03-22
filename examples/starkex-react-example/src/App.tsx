import "./App.css";
import OpenLogin from "openlogin";
import { useEffect, useState } from "react";
import { grindKey, starkEc } from "@toruslabs/openlogin-starkkey";
import { ec as elliptic } from "elliptic";
import StarkExAPI from "@starkware-industries/starkex-js/dist/browser";

const YOUR_PROJECT_ID = "BLTJPXxanIYyNTauQRb0dLJBYClvh6nU8G1SPct3K0ZUDksMgs1B5Sb-q533ng7a_owi4gHj1nvZZ_sK79b2Juw";
const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "testnet",
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

const starkExAPI = new StarkExAPI({
  endpoint: "https://gw.playground-v2.starkex.co",
});
function App() {
  const [loading, setLoading] = useState(false);
  const [starkIsAlive, setStarkIsAlive] = useState(false);
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

  const checkStarkIsAlive = async () => {
    const isAlive = await starkExAPI.gateway.isAlive();
    setStarkIsAlive(isAlive);
    console.log("---isAlive", isAlive); // gateway is alive!
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
        await checkStarkIsAlive();
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
          await checkStarkIsAlive();
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

  const getStarkAccount = (): elliptic.KeyPair => {
    const starkEcOrder = starkEc.n;

    const account = starkEc.keyFromPrivate(grindKey(openlogin.privKey, starkEcOrder), "hex");
    return account;
  };

  const starkHdAccount = (e: any): elliptic.KeyPair => {
    e.preventDefault();
    const account = getStarkAccount();
    printToConsole({
      privKey: account.getPrivate("hex"),
      pubKey: account.getPublic("hex"),
    });
    return account;
  };

  const getStarkKey = (): string => {
    const account = getStarkAccount();
    return account.getPrivate("hex");
  };

  const onMintRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = getStarkKey();
    const request = {
      txId,
      vaultId: 1654615998,
      amount: "6",
      tokenId: "0x400de4b5a92118719c78df48f4ff31e78de58575487ce1eaf19922ad9b8a714",
      starkKey: `0x${starkKey}`,
    };
    const response = await starkExAPI.gateway.mint(request);
    console.log("---response", response);
    printToConsole({ response });
  };

  const onDepositRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = getStarkKey();
    const request = {
      txId,
      amount: 8,
      starkKey: `0x${starkKey}`,
      tokenId: "0x3ef811e040c4bc9f9eee715441cee470f5d5aff69b9cd9aca7884f5a442a890",
      vaultId: 1924014660,
    };
    const response = await starkExAPI.gateway.deposit(request);
    console.log("---response", response);
    printToConsole({ response });
  };

  const onWithdrawalRequest = async () => {
    const txId = await starkExAPI.gateway.getFirstUnusedTxId();
    const starkKey = getStarkKey();
    const request = {
      txId,
      amount: 8,
      starkKey: `0x${starkKey}`,
      tokenId: "0x2dd48fd7a024204f7c1bd874da5e709d4713d60c8a70639eb1167b367a9c378",
      vaultId: 612008755,
    };
    const response = await starkExAPI.gateway.withdrawal(request);
    console.log("---response", response);
    printToConsole({ response });
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
              <h3>Openlogin X StarkEx</h3>
              <button onClick={login}>login</button>
            </div>
          ) : (
            <div>
              <section>
                <div>
                  Openlogin Private key:
                  <i>{openlogin.privKey}</i>
                  <button onClick={() => logout()}>Logout</button>
                </div>
                <div>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                    <button onClick={printUserInfo}>Get User Info</button>
                    <form onSubmit={starkHdAccount}>
                      <button type="submit">Get Stark Account</button>
                    </form>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <h3>
                      <div>{starkIsAlive ? "Gateway is alive" : "Gateway is not live"}</div>
                    </h3>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                      <button onClick={onMintRequest}>Mint Request</button>
                      <button onClick={onDepositRequest}>Deposit Request</button>
                      <button onClick={onWithdrawalRequest}>Withdrawal Request</button>
                    </div>
                  </div>
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
