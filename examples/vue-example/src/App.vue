<template>
  <div id="app">
    <div v-if="loading">
      <div class="loader-wrap">
        <h1>....loading</h1>
      </div>
    </div>
    <div>
      <div v-if="!privKey && !loading">
        <h3>Login With Openlogin</h3>
        <button @click="login">login</button>
      </div>

      <div v-if="privKey">
        <section>
          <div>
            Private key:
            <i>{{ privKey }}</i>
          </div>
          <div>
            Connected ChainId
            <i>{{ ethereumPrivateKeyProvider.state.chainId }}</i>
            <button @click="logout">Logout</button>
          </div>
          <div>
            <button @click="getUserInfo">Get User Info</button>
            <button @click="getEd25519Key">Get Ed25519Key</button>
            <button @click="signMessage" :disabled="!ethereumPrivateKeyProvider.provider">Sign Test Eth Message</button>
            <button @click="signV1Message" :disabled="!ethereumPrivateKeyProvider.provider">Sign Typed data v1 test message</button>
            <button @click="latestBlock" :disabled="!ethereumPrivateKeyProvider.provider">Fetch Latest Block</button>
            <button @click="switchChain" :disabled="!ethereumPrivateKeyProvider.provider">Switch to rinkeby</button>
            <button @click="addChain" :disabled="!ethereumPrivateKeyProvider.provider">Add Rinkeby Chain</button>

            <div id="console">
              <p />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { DEFAULT_INFURA_ID, SafeEventEmitterProvider } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import * as bs58 from "bs58";
import OpenLogin from "openlogin";
import Vue from "vue";

import * as ethWeb3 from "./lib/ethWeb3";
const YOUR_PROJECT_ID = "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs";
const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "testnet",
  uxMode: "redirect",
});
export default Vue.extend({
  name: "App",
  data() {
    return {
      loading: false,
      privKey: "",
      ethereumPrivateKeyProvider: null as EthereumPrivateKeyProvider | null,
    };
  },
  async mounted() {
    this.loading = true;
    await openlogin.init();
    this.privKey = openlogin.privKey;
    if (this.privKey) await this.setProvider(this.privKey);

    this.loading = false;
  },
  methods: {
    async login() {
      this.loading = true;
      try {
        // in popup mode (with third party cookies available) or if user is already logged in this function will
        // return priv key , in redirect mode or if third party cookies are blocked then priv key be injected to
        // sdk instance after calling init on redirect url page.
        const privKey = await openlogin.login({
          mfaLevel: "mandatory",
          // pass empty string '' as loginProvider to open default torus modal
          // with all default supported login providers or you can pass specific
          // login provider from available list to set as default.
          // for ex: google, facebook, twitter etc
          loginProvider: "",
          redirectUrl: `${window.origin}`,
          relogin: true,
          // you can pass standard oauth parameter in extralogin options
          // for ex: in case of passwordless login, you have to pass user's email as login_hint
          // and your app domain.
          // extraLoginOptions: {
          //   domain: 'www.yourapp.com',
          //   login_hint: 'hello@yourapp.com',
          // },
        });
        if (privKey) {
          this.privKey = openlogin.privKey;
          await this.setProvider(this.privKey);
        }
      } catch (error) {
        console.log("error", error);
      } finally {
        this.loading = false;
      }
    },

    async setProvider(privKey: string) {
      this.ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: {
            chainId: "0x3",
            rpcTarget: `https://ropsten.infura.io/v3/${DEFAULT_INFURA_ID}`,
            displayName: "ropsten",
            blockExplorer: "https://ropsten.etherscan.io/",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        },
      });
      await this.ethereumPrivateKeyProvider.setupProvider(privKey);
    },

    async getUserInfo() {
      const userInfo = await openlogin.getUserInfo();
      this.printToConsole(userInfo);
    },

    getEd25519Key() {
      const { sk } = getED25519Key(openlogin.privKey);
      const base58Key = bs58.encode(sk);
      this.printToConsole(base58Key);
    },
    async signMessage() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.signEthMessage(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("signedMessage", signedMessage);
    },
    async signV1Message() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.signTypedData_v1(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("signedMessage", signedMessage);
    },
    async latestBlock() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");

      const block = await ethWeb3.fetchLatestBlock(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("latest block", block);
    },
    async switchChain() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      try {
        await this.ethereumPrivateKeyProvider.provider.sendAsync({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4" }],
        });
        this.printToConsole("switchedChain", this.ethereumPrivateKeyProvider.state, this.ethereumPrivateKeyProvider.config);
      } catch (error) {
        console.log("error while switching chain", error);
        this.printToConsole("switchedChain error", error);
      }
    },

    async addChain() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      try {
        await this.ethereumPrivateKeyProvider.provider.sendAsync({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x4",
              chainName: "rinkeby",
              nativeCurrency: {
                name: "ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [`https://rinkeby.infura.io/v3/${DEFAULT_INFURA_ID}`],
              blockExplorerUrls: [`https://rinkeby.etherscan.io/`],
            },
          ],
        });
        this.printToConsole("added chain", this.ethereumPrivateKeyProvider.state, this.ethereumPrivateKeyProvider.config);
      } catch (error) {
        console.log("error while adding chain", error);
        this.printToConsole("add chain error", error);
      }
    },

    async logout() {
      await openlogin.logout({});
      this.privKey = openlogin.privKey;
      this.ethereumPrivateKeyProvider = null;
    },
    printToConsole(...args: unknown[]) {
      const el = document.querySelector("#console>p");
      if (el) {
        el.innerHTML = JSON.stringify(args || {}, null, 2);
      }
    },
  },
});
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#console {
  border: 0px solid black;
  height: 40px;
  padding: 2px;
  text-align: left;
  width: calc(100% - 20px);
  border-radius: 5px;
  margin-top: 20px;
  margin-bottom: 80px;
}
#console > p {
  margin: 0.5em;
}
button {
  height: 25px;
  margin: 5px;
  background: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
