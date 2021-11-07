import "./App.css";
import OpenLogin from "openlogin";
import { useEffect, useState } from "react";
import { getStarkHDAccount, starkEc, STARKNET_NETWORKS, sign, verify } from "@toruslabs/openlogin-starkkey";
import { binaryToHex, binaryToUtf8, bufferToBinary, bufferToHex, hexToBinary } from "enc-utils";
// import { privateToAddress } from "ethereumjs-util";
import type { ec } from "elliptic";
import { deployContract, CompiledContract, waitForTx, Contract, Abi, utils, hashMessage, pedersen } from "starknet";
import CompiledAccountContractAbi from "./contracts/account_abi.json";
import { BN } from "bn.js";
import { removeHexPrefix } from "starknet/dist/utils/encode";

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
function App() {
  const [loading, setLoading] = useState(false);
  const [CompiledAccountContract, setCompiledAccountContract] = useState<CompiledContract | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
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
    fetch("https://raw.githubusercontent.com/himanshuchawla009/cairo-contracts/master/account_compiled.json")
      .then((response) => response.json())
      .then((responseJson) => {
        setCompiledAccountContract(responseJson);
      })
      .catch((error) => {
        printToConsole(error);
      });
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

  const getStarkAccount = (index: number): { pubKey: string; privKey: string } => {
    const account = getStarkHDAccount(openlogin.privKey, index, STARKNET_NETWORKS.testnet);
    return account;
  };

  const starkHdAccount = (e: any): { pubKey?: string; privKey?: string } => {
    e.preventDefault();
    const accIndex = 1;
    const account = getStarkAccount(accIndex);
    printToConsole({
      ...account,
    });
    return account;
  };

  const strToHex = (str: string): string => {
    return binaryToHex(bufferToBinary(Buffer.from(str, "utf8")).padEnd(252, "0"));
  };

  /**
   *
   * @param str utf 8 string to be signed
   * @param prefix utf-8 prefix padded to 252 bits (optional)
   * @returns
   */
  const getPedersenHashRecursively = (str: string, prefix?: string): string => {
    const TEST_MESSAGE_SUFFIX = prefix || "OPENLOGIN STARKWARE-";
    const x = Buffer.from(str, "utf8");
    const binaryStr = hexToBinary(bufferToHex(x));
    const rounds = Math.ceil(binaryStr.length / 252);
    if (rounds > 1) {
      const currentChunkHex = binaryToHex(binaryStr.substring(0, 252));
      const hash = pedersen([strToHex(TEST_MESSAGE_SUFFIX), new BN(currentChunkHex, "hex").toString(16)]);
      const pendingStr = binaryToUtf8(binaryStr.substring(252));
      return getPedersenHashRecursively(pendingStr.replace("\n", ""), hash);
    }
    const currentChunkHex = binaryToHex(binaryStr.padEnd(252, "0"));
    return pedersen([utils.number.toBN(strToHex(TEST_MESSAGE_SUFFIX), "hex"), utils.number.toBN(currentChunkHex, "hex")]);
  };

  const signMessageWithStarkKey = (e: any) => {
    e.preventDefault();
    const accIndex = 1;
    const message = e.target[0].value;
    const account = getStarkAccount(accIndex);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
    const hash = getPedersenHashRecursively(message);
    const signed = sign(keyPair, removeHexPrefix(hash));
    printToConsole({
      pedersenHash: hash,
      info: `Message signed successfully: OPENLOGIN STARKWARE- ${message}`,
      signedMesssage: signed,
    });
  };

  const validateStarkMessage = (e: any) => {
    e.preventDefault();
    const signingAccountIndex = 1;
    const originalMessage = e.target[0].value;
    const signedMessage = JSON.parse(e.target[1].value) as ec.Signature;
    if (!signedMessage.r || !signedMessage.s || signedMessage.recoveryParam === undefined) {
      printToConsole("Invalid signature format");
      return;
    }
    const finalSignature = {
      r: new BN(signedMessage.r, "hex"),
      s: new BN(signedMessage.s, "hex"),
      recoveryParam: signedMessage.recoveryParam,
    };
    const account = getStarkAccount(signingAccountIndex);
    const keyPair = starkEc.keyFromPublic(account.pubKey, "hex");
    const hash = getPedersenHashRecursively(originalMessage);
    const isVerified = verify(keyPair, removeHexPrefix(hash), finalSignature as unknown as ec.Signature);
    printToConsole(`Message is verified: ${isVerified}`);
  };

  const deployAccountContract = async () => {
    try {
      if (!CompiledAccountContract) {
        printToConsole("Compiled contract is not downloaded, plz try again");
        return;
      }
      const accountIndex = 1;
      const starkAccount = getStarkAccount(accountIndex);
      const compressedPubKey = starkEc.keyFromPrivate(starkAccount.privKey).getPublic().getX().toString(16, 64);
      const txRes = await deployContract(JSON.parse(JSON.stringify(CompiledAccountContract)) as CompiledContract, [
        new BN(compressedPubKey, 16).toString(),
      ]);
      printToConsole("deployed account contract,", {
        contractRes: txRes,
        l2AccountAddress: txRes.address,
        txStatusLink: `https://voyager.online/tx/${txRes.transaction_hash}`,
      });
      await waitForTx(txRes.transaction_hash);
      printToConsole("successfully included in a block on l2", {
        txStatusLink: `https://voyager.online/tx/${txRes.transaction_hash}`,
      });
    } catch (error) {
      printToConsole(error);
    }
  };

  const onContractAddressChange = (e: any) => {
    setContractAddress(e.target.value);
  };

  const initializeAccountContract = async () => {
    try {
      // const l1Address = `0x${privateToAddress(Buffer.from(openlogin.privKey, "hex")).toString("hex")}`;
      if (!contractAddress) {
        printToConsole("PLease input contract/account address");
        return;
      }
      const contract = new Contract(CompiledAccountContractAbi as Abi[], contractAddress);

      // const isInitialized = await contract.call("assert_initialized", {});
      const txRes = await contract.invoke("initialize", {
        _address: contractAddress,
      });

      printToConsole("deployed account contract,", {
        // isInitialized,
        contractRes: txRes,
        txStatusLink: `https://voyager.online/tx/${txRes.transaction_hash}`,
      });
      await waitForTx(txRes.transaction_hash);
      printToConsole("successfully included in a block", {
        txStatusLink: `https://voyager.online/tx/${txRes.transaction_hash}`,
      });
    } catch (error) {
      printToConsole(error);
    }
  };

  const getPublickeyFromContract = async () => {
    try {
      if (!contractAddress) {
        printToConsole("PLease input contract/account address");
        return;
      }
      const account = new Contract(CompiledAccountContractAbi as Abi[], contractAddress);
      const res = await account.call("get_public_key", {});
      printToConsole(res);
    } catch (error) {
      printToConsole((error as Error).toString());
    }
  };

  const getAddressFromContract = async () => {
    try {
      if (!contractAddress) {
        printToConsole("PLease input contract/account address");
        return;
      }
      const account = new Contract(CompiledAccountContractAbi as Abi[], contractAddress);

      const res = await account.call("get_address", {});
      printToConsole(res);
    } catch (error) {
      printToConsole(error);
    }
  };

  // Note: this function is inputting same public key which is already initialized in constructor.
  // However you can use a different publicKey, this is just for demonstration purpose.
  const updatePublickeyInContract = async () => {
    try {
      if (!contractAddress) {
        printToConsole("PLease input contract/account address");
        return;
      }
      const accountIndex = 1;
      const starkAccount = getStarkAccount(accountIndex);
      const keyPair = starkEc.keyFromPrivate(starkAccount.privKey);
      const compressedPubKey = keyPair.getPublic().getX().toString(16, 64);
      const account = new Contract(CompiledAccountContractAbi as Abi[], contractAddress);

      // const l1Address = `0x${privateToAddress(Buffer.from(openlogin.privKey, "hex")).toString("hex")}`;

      const { res: nonceRes } = await account.call("get_nonce");
      const msgHash = removeHexPrefix(
        hashMessage(
          contractAddress,
          contractAddress,
          utils.starknet.getSelectorFromName("set_public_key"),
          [
            new BN(compressedPubKey, 16).toString(),
            // contractAddress,
          ],
          nonceRes.toString()
        )
      );

      const { r, s } = sign(keyPair, msgHash);
      console.log("utils.number.toHex(r)", utils.number.toHex(r));
      const res = await account.invoke(
        "execute",
        {
          to: contractAddress,
          selector: utils.starknet.getSelectorFromName("set_public_key"),
          calldata: [
            new BN(compressedPubKey, 16).toString(),
            // contractAddress,
          ],
        },
        [utils.number.toHex(r), utils.number.toHex(s)]
      );

      printToConsole(res);
      await waitForTx(res.transaction_hash);
      printToConsole("transaction successfully included in a block", {
        txStatusLink: `https://voyager.online/tx/${res.transaction_hash}`,
      });
    } catch (error) {
      console.log(error);
      printToConsole((error as Error).toString());
    }
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
              <h3>Openlogin X Starkware</h3>
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
                      <button type="submit">Get Stark Account </button>
                    </form>
                    <button onClick={deployAccountContract}>Deploy Account Contract (Step 1)</button>
                  </div>
                  <br />
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <textarea
                      id="contractAddress"
                      rows={3}
                      cols={50}
                      placeholder="Enter Contract/L2 account address"
                      onChange={onContractAddressChange}
                    />
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                      <button onClick={initializeAccountContract}>Initialize Account Contract (Step 2) </button>
                      <button onClick={getPublickeyFromContract}>Get Publickey From Contract (Step 3)</button>
                      <button onClick={getAddressFromContract}>Get Address From Contract (Step 3)</button>
                      <button onClick={updatePublickeyInContract}>Update Publickey In Contract (Step 3)</button>
                    </div>
                  </div>

                  <br />
                  <br />
                  <hr />
                  <form
                    onSubmit={signMessageWithStarkKey}
                    style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                  >
                    <textarea id="message" rows={3} cols={50} placeholder="Enter message" required />
                    <button type="submit">Sign Message with StarkKey </button>
                  </form>
                  <br />
                  <br />
                  <hr />

                  <form
                    onSubmit={validateStarkMessage}
                    style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                  >
                    <textarea id="originalMessage" cols={100} rows={5} placeholder="Enter Original Message" required />
                    <textarea id="signedMessage" cols={100} rows={5} placeholder="Enter Signed Message" required />
                    <button type="submit">Validate Stark Message</button>
                  </form>
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
