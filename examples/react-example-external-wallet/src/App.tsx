import "./App.css";
import { useState } from "react";
import OpenLogin, { OPENLOGIN_NETWORK } from "openlogin";
import Web3 from "web3";

declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}

const detectCurrentProvider = () => {
  let provider;
  if (window.ethereum) {
    provider = window.ethereum;
  } else if (window.web3) {
    provider = window.web3.currentProvider;
  } else {
    console.log(`Non-Ethereum browser detected. You should consider trying MetaMask!`);
  }
  return provider;
};

function App() {
  const [loading, setLoading] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [currentProvider, setProvider] = useState<any>();

  const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";
  const openlogin = new OpenLogin({
    // your clientId aka projectId , get it from https://developer.tor.us
    // clientId is not required for localhost, you can set it to any string
    // for development
    clientId: YOUR_PROJECT_ID,
    network: OPENLOGIN_NETWORK.EXTERNAL,
    payload: {
      network: "ethereum",
      payload: {
        domain: window.location.origin,
        address: publicKey,
        statement: "Sign-In With Web3",
        uri: window.location.href,
        version: "1",
        chainId: 1,
      },
    },
  });

  async function sign(): Promise<any> {
    const web3 = new Web3(currentProvider);
    const signature = await web3.eth.personal.sign(openlogin.siwwMessage, publicKey, "", (err, result) => {
      if (err) {
        throw Error(err.message);
      }
      return result;
    });
    openlogin.siwwObject.signature = { s: signature, t: "eip191" };
    const verificationStatus = await openlogin.siwwObject.verify(openlogin.siwwObject.payload, openlogin.siwwObject.signature);
    if (verificationStatus.success) {
      alert("Login Successful");
    }
  }

  async function login() {
    setLoading(true);
    try {
      let currentAccount = "";
      setProvider(detectCurrentProvider());
      if (currentProvider) {
        if (currentProvider !== window.ethereum) {
          console.error(`Non-Ethereum browser detected.`);
        }
        await currentProvider.request({ method: "eth_requestAccounts" });
        const web3 = new Web3(currentProvider);
        const userAccount = await web3.eth.getAccounts();
        if (userAccount.length === 0) {
          console.log(`Please connect to meta mask`);
        } else {
          [currentAccount] = userAccount;
          setPublicKey(currentAccount);
          if (currentAccount !== "") {
            console.log(await sign());
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.log("error", error);
      setLoading(false);
    }
  }

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
            <h1>....Loading</h1>
          </div>
        </div>
      ) : (
        <div className="App">
          <div>
            <h3>Login With Openlogin</h3>
            <button onClick={login}>login</button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
