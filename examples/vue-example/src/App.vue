<template>
  <div>
    <!-- Loader -->
    <div class="loader-container" v-if="loading">Loading...</div>
    <!-- Login -->
    <div class="login-container" v-if="!privKey">
      <h1 class="login-heading">demo-openlogin.web3auth.io</h1>
      <h3 class="login-subheading">Login in with Openlogin</h3>
      <div class="whitelabel">
        <label for="whitelabel">Enable whitelabel</label>
        <input type="checkbox" id="whitelabel" name="whitelabel" v-model="isWhiteLabelEnabled" />
      </div>
      <div class="mpc">
        <label for="mpc">Enable MPC</label>
        <input type="checkbox" id="mpc" name="mpc" v-model="useMpc" />
      </div>
      <div class="mfa">
        <label for="mfa">Enable All MFA Factors</label>
        <input type="checkbox" id="mfa" name="mfa" v-model="enableAllFactors" />
      </div>
      <div class="wallet-key">
        <label for="mpc">Enable Wallet Key</label>
        <input type="checkbox" id="walletKey" name="walletKey" v-model="useWalletKey" />
      </div>
      <select v-model="selectedBuildEnv" class="select">
        <option :key="login" v-for="login in Object.values(BUILD_ENV)" :value="login">{{ login }}</option>
      </select>
      <select v-model="selectedOpenloginNetwork" class="select">
        <option :key="login" v-for="login in Object.values(OPENLOGIN_NETWORK)" :value="login">{{ login }}</option>
      </select>
      <select v-model="selectedUxMode" class="select">
        <option :key="login" v-for="login in Object.values(UX_MODE)" :value="login">{{ login }}</option>
      </select>
      <select v-model="selectedLoginProvider" class="select">
        <option :key="login" v-for="login in computedLoginProviders" :value="login">{{ login }}</option>
      </select>
      <select v-if="showEmailFlow" v-model="emailFlowType" class="select">
        <option :key="flow" v-for="flow in Object.values(EMAIL_FLOW)" :value="flow">{{ flow }}</option>
      </select>
      <input
        v-model="login_hint"
        v-if="selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS"
        placeholder="Enter an email"
        required
        class="login-input"
      />
      <input
        v-model="login_hint"
        v-if="selectedLoginProvider === LOGIN_PROVIDER.SMS_PASSWORDLESS"
        placeholder="Eg: (+{cc}-{number})"
        required
        class="login-input"
      />
      <div :class="['login-btn']">
        <button class="btn" :disabled="!isLoginHintAvailable" @click="login">Login with {{ selectedLoginProvider?.replaceAll("_", " ") }}</button>
      </div>
    </div>
    <!-- Dashboard -->
    <div v-else class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="max-sm:w-full">
          <h1 class="dashboard-heading">demo-openlogin.web3auth.io</h1>
          <p class="dashboard-subheading">Openlogin Private key : {{ privKey }}</p>
        </div>
        <div class="dashboard-action-container max-sm:flex max-sm:justify-between">
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
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" @click="getUserInfo">Get user info</button>
            <button class="btn" @click="getOpenloginState">Get openlogin state</button>
            <!-- <button class="btn" @click="getEd25519Key">Get Ed25519Key</button> -->
          </div>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" @click="getEd25519Key">Get Ed25519Key</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button v-if="!isMFAEnabled" class="btn" @click="enableMFA">Enable MFA</button>
            <button v-else class="btn" @click="manageMFA">Manage MFA</button>
          </div>
          <p class="btn-label">Signing</p>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="signMessage">Sign test Eth Message</button>
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="signMpcMessage">Sign test Eth Message (MPC)</button>
            <!-- <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="latestBlock">Fetch latest block</button> -->
          </div>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="latestBlock">Fetch latest block</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="addChain">Add Goerli</button>
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="switchChain">Switch to Goerli</button>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 bottom-gutter">
            <button class="btn" :disabled="!ethereumPrivateKeyProvider?.provider" @click="signV1Message">Sign Typed data v1 test msg</button>
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
import { EthereumSigningProvider as EthMpcPrivKeyProvider } from "@web3auth-mpc/ethereum-provider";
import * as bs58 from "bs58";
import { generatePrivate } from "@toruslabs/eccrypto";
import { defineComponent } from "vue";
import BN from "bn.js";
import { Client, getDKLSCoeff, setupSockets } from "@toruslabs/tss-client";
import { TORUS_SAPPHIRE_NETWORK_TYPE } from "@toruslabs/constants";

import * as ethWeb3 from "./lib/ethWeb3";
import { CURVE, DELIMITERS } from "./constants";
import whitelabel from "./lib/whitelabel";
import OpenLogin from "@toruslabs/openlogin";
import {
  LoginParams,
  LOGIN_PROVIDER,
  LOGIN_PROVIDER_TYPE,
  UX_MODE,
  UX_MODE_TYPE,
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
  BUILD_ENV,
  storageAvailable,
} from "@toruslabs/openlogin-utils";
import loginConfig from "./lib/loginConfig";
import { keccak256 } from "ethereum-cryptography/keccak";
import { generateTSSEndpoints, getTSSEndpoints } from "./utils";

const OPENLOGIN_PROJECT_IDS: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  [OPENLOGIN_NETWORK.MAINNET]: "BCtbnOamqh0cJFEUYA0NB5YkvBECZ3HLZsKfvSRBvew2EiiKW3UxpyQASSR0artjQkiUOCHeZ_ZeygXpYpxZjOs",
  [OPENLOGIN_NETWORK.TESTNET]: "BJ6l3_kIQiy6YVL7zDlCcEAvGpGukwFgp-C_0WvNI_fAEeIaoVRLDrV5OjtbZr_zJxbyXFsXMT-yhQiUNYvZWpo",
  [OPENLOGIN_NETWORK.AQUA]: "BK19YSk7lHGp9NdAb-HFj6DHI2sZ7DCncztz8xZazLd54_28KrQm8QDSgxZm4F0uhjiGuzdzxZyNEqgNst3oRtM",
  [OPENLOGIN_NETWORK.CYAN]: "BHhjZ5eaJLgRtz1nVBwCFvlbpCCOHlK4Sxku2m56Gufn5IBuK9XfUzKg_HDlos14I-ZbsN1CgSLszZzr9ICc2Ho",
  [OPENLOGIN_NETWORK.SAPPHIRE_DEVNET]: "openlogin",
  [OPENLOGIN_NETWORK.SAPPHIRE_MAINNET]: "openlogin",
  [OPENLOGIN_NETWORK.CELESTE]: "openlogin",
};

const EMAIL_FLOW = {
  link: "link",
  code: "code",
};

const vueapp = defineComponent({
  name: "App",
  data() {
    return {
      loading: false,
      enableAllFactors: false,
      privKey: "",
      ethereumPrivateKeyProvider: null as EthereumPrivateKeyProvider | EthMpcPrivKeyProvider | null,
      LOGIN_PROVIDER: LOGIN_PROVIDER,
      selectedLoginProvider: LOGIN_PROVIDER.GOOGLE as LOGIN_PROVIDER_TYPE,
      login_hint: "",
      isWhiteLabelEnabled: false,
      UX_MODE: UX_MODE,
      selectedUxMode: UX_MODE.REDIRECT as UX_MODE_TYPE,
      OPENLOGIN_NETWORK: OPENLOGIN_NETWORK,
      BUILD_ENV: BUILD_ENV,
      selectedOpenloginNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET as OPENLOGIN_NETWORK_TYPE,
      useMpc: false,
      useWalletKey: false,
      selectedBuildEnv: BUILD_ENV.PRODUCTION,
      emailFlowType: EMAIL_FLOW.code,
      EMAIL_FLOW: EMAIL_FLOW,
    };
  },
  async created() {
    if (storageAvailable("sessionStorage")) {
      const data = sessionStorage.getItem("state");
      if (data) {
        const state = JSON.parse(data);
        Object.assign(this.$data, state);
      }
    }
    this.openloginInstance.options.uxMode = this.selectedUxMode;
    this.openloginInstance.options.whiteLabel = this.isWhiteLabelEnabled ? whitelabel : {};
    this.openloginInstance.options.mfaSettings = this.enableAllFactors
      ? {
          backUpShareFactor: { enable: true },
          deviceShareFactor: { enable: true },
          passwordFactor: { enable: true },
          socialBackupFactor: { enable: true },
        }
      : undefined;
    await this.openloginInstance.init();
    if (this.openloginInstance.state.factorKey) {
      this.useMpc = true;
      this.openloginInstance.options.useMpc = true;
      await this.openloginInstance.init();
    }
    if (this.openloginInstance.privKey || this.openloginInstance.state.factorKey || this.openloginInstance.state.walletKey) {
      this.privKey = this.openloginInstance.privKey || (this.openloginInstance.state.factorKey as string) || (this.openloginInstance.state.walletKey as string);
      await this.setProvider(this.privKey);
    }
    this.loading = false;
  },
  updated() {
    // this is called on each state update
    console.log(this.$data);
    if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(this.$data));
  },
  computed: {
    computedLoginProviders(): LOGIN_PROVIDER_TYPE[] {
      return Object.values(LOGIN_PROVIDER).filter((x) => x !== "jwt" && x !== "webauthn");
    },
    isLoginHintAvailable(): boolean {
      if (this.selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS || this.selectedLoginProvider === LOGIN_PROVIDER.SMS_PASSWORDLESS) {
        if (!this.login_hint) {
          return false;
        }
        if (this.selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS && !this.login_hint.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
          return false;
        }
        if (this.selectedLoginProvider === LOGIN_PROVIDER.SMS_PASSWORDLESS && !(this.login_hint.startsWith("+") && this.login_hint.includes("-"))) {
          return false;
        }
      }
      return true;
    },
    isLongLines(): boolean {
      return ([LOGIN_PROVIDER.EMAIL_PASSWORDLESS, LOGIN_PROVIDER.SMS_PASSWORDLESS] as LOGIN_PROVIDER_TYPE[]).includes(this.selectedLoginProvider);
    },
    openloginInstance(): OpenLogin {
      const currentClientId = OPENLOGIN_PROJECT_IDS[this.selectedOpenloginNetwork];
      const op = new OpenLogin({
        clientId: currentClientId,
        network: this.selectedOpenloginNetwork,
        uxMode: this.selectedUxMode,
        whiteLabel: this.isWhiteLabelEnabled ? whitelabel : {},
        loginConfig: loginConfig,
        useMpc: this.useMpc,
        buildEnv: this.selectedBuildEnv,
        // sdkUrl: "https://staging.openlogin.com",
        mfaSettings: this.enableAllFactors
          ? {
              backUpShareFactor: { enable: true },
              deviceShareFactor: { enable: true },
              passwordFactor: { enable: true },
              socialBackupFactor: { enable: true },
            }
          : undefined,
      });
      op.init();
      return op;
    },
    showEmailFlow(): boolean {
      return this.selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS;
    },
    isMFAEnabled(): boolean {
      return this.openloginInstance.state.userInfo?.isMfaEnabled || false;
    },
  },
  methods: {
    async login() {
      try {
        this.loading = true;
        if (!this.openloginInstance) {
          this.loading = false;
          return;
        }
        this.openloginInstance.options.uxMode = this.selectedUxMode;
        this.openloginInstance.options.whiteLabel = this.isWhiteLabelEnabled ? whitelabel : {};
        this.openloginInstance.options.mfaSettings = this.enableAllFactors
          ? {
              backUpShareFactor: { enable: true },
              deviceShareFactor: { enable: true },
              passwordFactor: { enable: true },
              socialBackupFactor: { enable: true },
            }
          : undefined;
        // in popup mode (with third party cookies available) or if user is already logged in this function will
        // return priv key , in redirect mode or if third party cookies are blocked then priv key be injected to
        // sdk instance after calling init on redirect url page.
        const openLoginObj: LoginParams = {
          loginProvider: this.selectedLoginProvider,
          mfaLevel: "optional",
          getWalletKey: this.useWalletKey,
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

        if (this.isLongLines) {
          openLoginObj.extraLoginOptions = {
            login_hint: this.login_hint,
          };
        }

        if (this.emailFlowType) {
          openLoginObj.extraLoginOptions = {
            ...openLoginObj.extraLoginOptions,
            flow_type: this.emailFlowType,
          };
        }

        console.log(openLoginObj, "OPENLOGIN");
        await this.openloginInstance.login(openLoginObj);
        if (this.openloginInstance.privKey || this.openloginInstance.state.walletKey) {
          this.privKey = this.openloginInstance.privKey || (this.openloginInstance.state.walletKey || "");
          await this.setProvider(this.privKey);
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    async setProvider(privKey: string) {
      if (this.useMpc) {
        const { factorKey, tssPubKey, tssShareIndex, userInfo, tssShare, tssNonce, signatures } = this.openloginInstance.state;
        this.ethereumPrivateKeyProvider = new EthMpcPrivKeyProvider({
          config: {
            chainConfig: {
              chainId: "0x1",
              rpcTarget: `https://rpc.ankr.com/eth`,
              displayName: "Mainnet",
              blockExplorer: "https://etherscan.io/",
              ticker: "ETH",
              tickerName: "Ethereum",
            },
          },
        });
        if (!factorKey) throw new Error("factorKey not present");
        if (!tssPubKey) {
          throw new Error("tssPubKey not available");
        }

        const vid = `${userInfo?.aggregateVerifier || userInfo?.verifier}${DELIMITERS.Delimiter1}${userInfo?.verifierId}`;
        const sessionId = `${vid}${DELIMITERS.Delimiter2}default${DELIMITERS.Delimiter3}${tssNonce}${DELIMITERS.Delimiter4}`;

        const sign = async (msgHash: Buffer) => {
          const parties = 4;
          const clientIndex = parties - 1;
          const tss = await import("@toruslabs/tss-lib");
          // 1. setup
          // generate endpoints for servers
          const tssNodeEndpoints = getTSSEndpoints(this.selectedOpenloginNetwork as TORUS_SAPPHIRE_NETWORK_TYPE);
          const { endpoints, tssWSEndpoints, partyIndexes } = generateTSSEndpoints(tssNodeEndpoints, parties, clientIndex);
          const randomSessionNonce = Buffer.from(keccak256(Buffer.from(generatePrivate().toString("hex") + Date.now(), "utf8"))).toString("hex");
          const tssImportUrl = `${tssNodeEndpoints[0]}/v1/clientWasm`;
          // session is needed for authentication to the web3auth infrastructure holding the factor 1
          const currentSession = `${sessionId}${randomSessionNonce}`;

          // setup mock shares, sockets and tss wasm files.
          const [sockets] = await Promise.all([setupSockets(tssWSEndpoints, randomSessionNonce), tss.default(tssImportUrl)]);

          const participatingServerDKGIndexes = [1, 2, 3];
          const dklsCoeff = getDKLSCoeff(true, participatingServerDKGIndexes, tssShareIndex as number);
          const denormalisedShare = dklsCoeff.mul(new BN(tssShare as string, "hex")).umod(CURVE.curve.n);
          const share = Buffer.from(denormalisedShare.toString(16, 64), "hex").toString("base64");

          if (!currentSession) {
            throw new Error(`sessionAuth does not exist ${currentSession}`);
          }

          if (!signatures) {
            throw new Error(`Signature does not exist ${signatures}`);
          }

          const client = new Client(currentSession, clientIndex, partyIndexes, endpoints, sockets, share, tssPubKey, true, tssImportUrl);
          const serverCoeffs: Record<number, string> = {};
          for (let i = 0; i < participatingServerDKGIndexes.length; i++) {
            const serverIndex = participatingServerDKGIndexes[i];
            serverCoeffs[serverIndex] = getDKLSCoeff(false, participatingServerDKGIndexes, tssShareIndex as number, serverIndex).toString("hex");
          }
          client.precompute(tss, { signatures, server_coeffs: serverCoeffs });
          await client.ready();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { r, s, recoveryParam } = await client.sign(tss as any, Buffer.from(msgHash).toString("base64"), true, "", "keccak256", {
            signatures,
          });
          await client.cleanup(tss, { signatures, server_coeffs: serverCoeffs });
          return { v: recoveryParam, r: r.toArrayLike(Buffer, "be", 64), s: s.toArrayLike(Buffer, "be", 64) };
        };

        const getPublic: () => Promise<Buffer> = async () => {
          return Buffer.from(tssPubKey, "base64");
        };
        await this.ethereumPrivateKeyProvider.setupProvider({ sign, getPublic });
      } else {
        this.ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
          config: {
            chainConfig: {
              chainId: "0x1",
              rpcTarget: `https://rpc.ankr.com/eth`,
              displayName: "Mainnet",
              blockExplorer: "https://etherscan.io/",
              ticker: "ETH",
              tickerName: "Ethereum",
            },
          },
        });
        this.ethereumPrivateKeyProvider.setupProvider(privKey);
      }
    },

    async getUserInfo() {
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      const userInfo = this.openloginInstance.getUserInfo();
      this.printToConsole("User Info", userInfo);
    },

    async enableMFA() {
      throw new Error("Method not implemented in v5")
    },

    async manageMFA() {
      throw new Error("Method not implemented in v5")
    },

    async getOpenloginState() {
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      this.printToConsole("Openlogin State", this.openloginInstance.state);
    },

    getEd25519Key() {
      if (!this.openloginInstance) {
        throw new Error("Openlogin is not available.");
      }
      const { sk } = getED25519Key(this.privKey);
      const base58Key = bs58.encode(sk);
      this.printToConsole("ED25519 Key", base58Key);
    },

    async signMessage() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.signEthMessage(this.ethereumPrivateKeyProvider.provider);
      this.printToConsole("Signed Message", signedMessage);
    },

    async signMpcMessage() {
      if (!this.ethereumPrivateKeyProvider?.provider) throw new Error("provider not set");
      const signedMessage = await ethWeb3.ethSignTypedMessage(this.ethereumPrivateKeyProvider.provider);
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
          params: [{ chainId: "0x5" }],
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
              chainName: "goerli",
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
      if (storageAvailable("sessionStorage")) sessionStorage.removeItem("state");
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

export default vueapp;
</script>

<style scoped>
@import "./App.css";
</style>
