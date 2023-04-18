<template>
  <div>
    <!-- Loader -->
    <div class="loader-container" v-if="loading">Loading...</div>
    <!-- Login -->
    <div class="login-container" v-if="!privKey">
      <h1 class="login-heading">demo-openlogin.web3auth.io</h1>
      <h3 class="login-subheading">Login in with Openlogin</h3>
      <div class="login-btn">
        <button class="btn" @click="login">Login</button>
        <button class="btn" @click="loginWithoutWhitelabel">Login with WhiteLabel</button>
      </div>
    </div>
    <!-- Dashboard -->
    <div v-else class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-heading">demo-openlogin.web3auth.io</h1>
          <p class="dashboard-subheading">Openlogin Private key : {{ privKey }}</p>
        </div>
        <div class="dashboard-action-container">
          <p class="dashboard-chainid">Connect chainID : 0x5</p>
          <button class="dashboard-action-logout" @click.stop="logout">
            <img :src="require('@/assets/logout.svg')" alt="logout" height="18" width="18" />
            Logout
          </button>
        </div>
      </div>
      <!-- Dashboard Action Container -->
      <div class="dashboard-details-container">
        <div class="dashboard-details-btn-container">
          <p class="btn-label">User info</p>
          <div class="flex-row bottom-gutter">
            <button class="btn" @click="getUserInfo">Get user info</button>
            <button class="btn" @click="getEd25519Key">Get Ed25519Key</button>
          </div>
          <p class="btn-label">Signing</p>
          <div class="flex-row bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="signMessage">Sign test Eth Message</button>
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="latestBlock">Fetch latest block</button>
          </div>
          <div class="flex-row bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="addChain">Add to rinkeby</button>
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="switchChain">Switch to rinkeby</button>
          </div>
          <div class="flex-row bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="signV1Message">Sign Typed data v1 test message</button>
          </div>
        </div>
        <!-- Dashboard Console Container -->
        <div class="dashboard-details-console-container" id="console">
          <h1 class="console-heading"></h1>
          <pre class="console-container"></pre>
          <div class="clear-console-btn">
            <button class="btn console-btn" @click="clearConsole">Clear console</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import * as bs58 from "bs58";
import { defineComponent } from "vue";

import * as ethWeb3 from "./lib/ethWeb3";
import { getOpenLoginInstance } from "./lib/openlogin";
import whitelabel from "./lib/whitelabel";

export default defineComponent({
  name: "App",
  data() {
    return {
      loading: false,
      privKey: "",
      ethereumPrivateKeyProvider: null as EthereumPrivateKeyProvider | null,
      // TODO
      DEFAULT_INFURA_ID: "776218ac4734478c90191dde8cae483c",
    };
  },
  async mounted() {
    const openlogin = getOpenLoginInstance();
    await openlogin.init();
    if (openlogin.privKey) {
      this.privKey = openlogin.privKey;
      await this.setProvider(this.privKey);
    }
    this.loading = false;
  },
  methods: {
    async login() {
      try {
        this.loading = true;
        const openlogin = getOpenLoginInstance(whitelabel);
        // in popup mode (with third party cookies available) or if user is already logged in this function will
        // return priv key , in redirect mode or if third party cookies are blocked then priv key be injected to
        // sdk instance after calling init on redirect url page.
        const privKey = await openlogin.login({
          loginProvider: "google",
          mfaLevel: "optional",
          // pass empty string '' as loginProvider to open default torus modal
          // with all default supported login providers or you can pass specific
          // login provider from available list to set as default.
          // for ex: google, facebook, twitter etc
          redirectUrl: `${window.origin}`,
          // you can pass standard oauth parameter in extralogin options
          // for ex: in case of passwordless login, you have to pass user's email as login_hint
          // and your app domain.
          // extraLoginOptions: {
          //   domain: 'www.yourapp.com',
          //   login_hint: 'hello@yourapp.com',
          // },
          // sessionTime: 30, //seconds
        });
        if (privKey) {
          this.privKey = openlogin.privKey;
          await this.setProvider(this.privKey);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async loginWithoutWhitelabel() {
      try {
        this.loading = true;
        const openLoginPlain = getOpenLoginInstance();
        const { privKey } = await openLoginPlain.login({
          mfaLevel: "mandatory",
          loginProvider: "",
          redirectUrl: `${window.origin}`,
        });
        if (privKey) {
          this.privKey = privKey;
          await this.setProvider(this.privKey);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async setProvider(privKey: string) {
      this.ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: {
            chainId: "0x5",
            rpcTarget: `https://rpc.ankr.com/eth_goerli`,
            displayName: "goerli",
            blockExplorer: "https://goerli.etherscan.io/",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
        },
      });
      await this.ethereumPrivateKeyProvider.setupProvider(privKey);
    },

    async getUserInfo() {
      const openlogin = getOpenLoginInstance();
      const userInfo = await openlogin.getUserInfo();
      this.printToConsole("User Info", userInfo);
    },

    async signMessage() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.signEthMessage(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("Signed Message", signedMessage);
    },

    async signV1Message() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.signTypedData_v1(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("Signed Message", signedMessage);
    },

    async latestBlock() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const block = await ethWeb3.fetchLatestBlock(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("Latest block", block);
    },

    async switchChain() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      try {
        await this.ethereumPrivateKeyProvider.provider.sendAsync({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4" }],
        });
        this.printToConsole("Switched Chain", { ...this.ethereumPrivateKeyProvider.state, ...this.ethereumPrivateKeyProvider.config });
      } catch (error) {
        console.log("error while switching chain", error);
        this.printToConsole("Switched Chain Error", error);
      }
    },

    async addChain() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      try {
        await this.ethereumPrivateKeyProvider.provider.sendAsync({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x5",
              chainName: "rinkeby",
              nativeCurrency: {
                name: "ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.ankr.com/eth_goerli"],
              blockExplorerUrls: [`https://goerli.etherscan.io/`],
            },
          ],
        });
        this.printToConsole("Added chain", { ...this.ethereumPrivateKeyProvider.state, ...this.ethereumPrivateKeyProvider.config });
      } catch (error) {
        console.log("error while adding chain", error);
        this.printToConsole("Add chain error", error);
      }
    },

    async logout() {
      const openlogin = getOpenLoginInstance();
      await openlogin.logout({});
      this.privKey = openlogin.privKey;
      this.ethereumPrivateKeyProvider = null;
    },

    getEd25519Key() {
      const openlogin = getOpenLoginInstance();
      const { sk } = getED25519Key(openlogin.privKey);
      const base58Key = bs58.encode(sk);
      this.printToConsole("Ed25519Key", base58Key);
    },

    printToConsole(...args: unknown[]) {
      const el = document.querySelector("#console>pre");
      const h1 = document.querySelector("#console>h1");
      const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
      if (h1) {
        h1.innerHTML = args[0] as string;
      }
      if (el) {
        el.innerHTML = JSON.stringify(args[1] || {}, null, 2);
      }
      if (consoleBtn) {
        consoleBtn.style.display = "block";
      }
    },

    clearConsole() {
      const el = document.querySelector("#console>pre");
      const h1 = document.querySelector("#console>h1");
      const consoleBtn = document.querySelector<HTMLElement>("#console>div.clear-console-btn");
      if (h1) {
        h1.innerHTML = "";
      }
      if (el) {
        el.innerHTML = "";
      }
      if (consoleBtn) {
        consoleBtn.style.display = "none";
      }
    },
  },
});
</script>

<style scoped>
@import "./App.css";
</style>
