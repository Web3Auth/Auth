<template>
  <div>
    <!-- Loader -->
    <div class="loader-container" v-if="loading">Loading...</div>
    <!-- Login -->
    <div class="login-container" v-if="!privKey">
      <h1 class="login-heading">demo-openlogin.web3auth.io</h1>
      <h3 class="login-subheading">Login in with Openlogin</h3>
      <select v-model="selectedVerifier" class="select">
        <option :key="login" v-for="login in Object.keys(verifierMap)" :value="login">{{ verifierMap[login].name }}</option>
      </select>
      <input v-model="login_hint" v-if="selectedVerifier === TORUS_EMAIL_PASSWORDLESS" placeholder="Enter an email" required class="login-input" />
      <input
        v-model="login_hint"
        v-if="selectedVerifier === TORUS_SMS_PASSWORDLESS"
        placeholder="Eg: (+{cc}-{number})"
        required
        class="login-input"
      />
      <div :class="['login-btn', isLongLines ? 'torus-btn' : '']">
        <button class="btn" :disabled="!isLoginHintAvailable" @click="login">Login with {{ selectedVerifier?.replaceAll("_", " ") }}</button>
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

import {
  GOOGLE,
  HOSTED_EMAIL_PASSWORDLESS,
  HOSTED_SMS_PASSWORDLESS,
  TORUS_EMAIL_PASSWORDLESS,
  TORUS_SMS_PASSWORDLESS,
  verifierMap,
} from "./constants";
import * as ethWeb3 from "./lib/ethWeb3";
import { getOpenLoginInstance } from "./lib/openlogin";
import whitelabel from "./lib/whitelabel";
import OpenLogin from "@toruslabs/openlogin";
import { LoginParams } from "@toruslabs/openlogin-utils";
// import { LOGIN_PROVIDER } from "@toruslabs/openlogin-utils";

export default defineComponent({
  name: "App",
  data() {
    return {
      loading: false,
      privKey: "",
      ethereumPrivateKeyProvider: null as EthereumPrivateKeyProvider | null,
      // TODO
      DEFAULT_INFURA_ID: "776218ac4734478c90191dde8cae483c",
      selectedVerifier: GOOGLE,
      verifierMap,
      login_hint: "",
      TORUS_SMS_PASSWORDLESS,
      TORUS_EMAIL_PASSWORDLESS,
      email: "",
      openloginInstance: null as OpenLogin | null,
    };
  },
  async mounted() {
    this.selectedVerifier = GOOGLE;
    const openlogin = getOpenLoginInstance();
    await openlogin.init();
    this.openloginInstance = openlogin;
    if (openlogin.privKey) {
      this.privKey = openlogin.privKey;
      await this.setProvider(this.privKey);
    }
    this.loading = false;
  },
  computed: {
    isLoginHintAvailable(): boolean {
      if (this.selectedVerifier === TORUS_EMAIL_PASSWORDLESS || this.selectedVerifier === TORUS_SMS_PASSWORDLESS) {
        if (!this.login_hint) {
          return false;
        }
        if (this.selectedVerifier === TORUS_EMAIL_PASSWORDLESS && !this.login_hint.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
          return false;
        }
        if (this.selectedVerifier === TORUS_SMS_PASSWORDLESS && !(this.login_hint.startsWith("+") && this.login_hint.includes("-"))) {
          return false;
        }
      }
      return true;
    },
    isLongLines(): boolean {
      return [TORUS_SMS_PASSWORDLESS, TORUS_EMAIL_PASSWORDLESS, HOSTED_EMAIL_PASSWORDLESS, HOSTED_SMS_PASSWORDLESS].includes(this.selectedVerifier);
    },
  },
  methods: {
    async login() {
      try {
        this.loading = true;
        const openlogin = getOpenLoginInstance(whitelabel);
        await openlogin.init();
        this.openloginInstance = openlogin;
        // in popup mode (with third party cookies available) or if user is already logged in this function will
        // return priv key , in redirect mode or if third party cookies are blocked then priv key be injected to
        // sdk instance after calling init on redirect url page.
        const openLoginObj: LoginParams = {
          loginProvider: this.selectedVerifier,
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
        };

        if ([TORUS_EMAIL_PASSWORDLESS, TORUS_SMS_PASSWORDLESS].includes(this.selectedVerifier)) {
          const { typeOfLogin, clientId, verifier } = verifierMap[this.selectedVerifier];
          openLoginObj.extraLoginOptions = {
            login_hint: this.login_hint,
          };
        }

        console.log(openLoginObj, "OPENLOGIN");
        const privKey = await openlogin.login(openLoginObj);
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
        await openLoginPlain.init();
        this.openloginInstance = openLoginPlain;

        const { privKey } = await openLoginPlain.login({
          // mfaLevel: "mandatory",
          loginProvider: "google",
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
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      const userInfo = this.openloginInstance.getUserInfo();
      this.printToConsole(userInfo);
    },

    getEd25519Key() {
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      const { sk } = getED25519Key(this.privKey);
      const base58Key = bs58.encode(sk);
      this.printToConsole(base58Key);
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
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      await this.openloginInstance.logout();
      this.privKey = this.openloginInstance.privKey;
      this.ethereumPrivateKeyProvider = null;
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
