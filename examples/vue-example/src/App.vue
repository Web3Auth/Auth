<template>
  <main class="flex items-center justify-center h-screen">
    <nav class="bg-white fixed w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
          <img :src="`/assets/web3auth.svg`" class="h-8" alt="W3A Logo">
        </a>
        <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <button class="dashboard-action-logout" @click.stop="logout" v-if="privKey">
            <img :src="`/assets/logout.svg`" alt="logout" height="18" width="18" />
            Logout
          </button>
        </div>
        <div class="items-center justify-between w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
          <div class="max-sm:w-full">
            <h1 class="leading-tight text-3xl font-extrabold">demo-openlogin.web3auth.io</h1>
            <p class="leading-tight text-1xl" v-if="privKey">Openlogin Private key : {{ privKey }}</p>
          </div>
        </div>
      </div>
    </nav>
    <div class="w-[800px]" v-if="!privKey">


      <div class="text-3xl font-bold leading-tight mb-5 text-center">
        <Loader class="text-center" v-if="loading" />
      </div>

      <Card class="h-auto px-12 py-16">
        <div class="leading-tight text-2xl font-extrabold">Login in with Openlogin</div>
        <div class="text-app-gray-500 mt-2">
          This demo show how to use Openlogin SDK to login and sign messages using Openlogin SDK.
        </div>
        <div class="grid grid-cols-2 gap-5 mt-5">
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="useMpc" id="mpc" :show-label="true" :size="'small'" :label-disabled="'Disable MPC'"
              :label-enabled="'Enable MPC'" />
          </div>
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="enableAllFactors" id="mfa" :show-label="true" :size="'small'"
              :label-disabled="'Disable All MFA Factors'" :label-enabled="'Enable All MFA Factors'" />

          </div>
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="useWalletKey" id="walletKey" :show-label="true" :size="'small'"
              :label-disabled="'Disable Wallet Key'" :label-enabled="'Enable Wallet Key'" />

          </div>
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="isWhiteLabelEnabled" id="whitelabel" :show-label="true" :size="'small'"
              :label-disabled="'Disable Whitelabel'" :label-enabled="'Enable Whitelabel'" />

          </div>
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="enableEd25519Key" id="curveType" :show-label="true" :size="'small'"
              :label-disabled="'Disable ED25519 Key'" :label-enabled="'Enable ED25519 Key'" />

          </div>
          <div class="flex items-start w-full  gap-2">
            <Toggle v-model="isEnableMFA" id="enableMFA" :show-label="true" :size="'small'"
              :label-disabled="'Disable MFA'" :label-enabled="'Enable MFA'" />
          </div>

          <div>
            <Select v-model="selectedBuildEnv" class="mt-3" label="Select Build Env*" aria-label="Select Build Env*"
              placeholder="Select Build Env" :options="Object.values(BUILD_ENV).map((x) => ({ name: x, value: x }))"
              :helper-text="`Selected Build Env: ${selectedBuildEnv}`" :error="!selectedBuildEnv" />
          </div>

          <div>
            <TextField v-model="customSdkUrl" class="mt-3" label="Enter custom url" aria-label="Enter custom url"
              placeholder="Enter custom url" required />
          </div>
          <div>
            <Select v-model="selectedOpenloginNetwork" class="mt-3" label="Select Openlogin Network*"
              aria-label="Select Openlogin Network*" placeholder="Select Openlogin Network"
              :options="Object.values(OPENLOGIN_NETWORK).map((x) => ({ name: x, value: x }))"
              :helper-text="`Selected Openlogin Network: ${selectedOpenloginNetwork}`"
              :error="!selectedOpenloginNetwork" />
          </div>
          <div>
            <Select v-model="selectedUxMode" class="mt-3" label="Select UX Mode*" aria-label="Select UX Mode*"
              placeholder="Select UX Mode" :options="Object.values(UX_MODE).map((x) => ({ name: x, value: x }))"
              :helper-text="`Selected UX Mode: ${selectedUxMode}`" :error="!selectedUxMode" />
          </div>
          <div>
            <Select v-if="isWhiteLabelEnabled" v-model="selectedLanguage" class="mt-3" label="Select Language*"
              aria-label="Select Language*" placeholder="Select Language"
              :options="Object.values(LANGUAGE).map((x) => ({ name: x, value: x }))"
              :helper-text="`Selected Language: ${selectedLanguage}`" :error="!selectedLanguage" />
          </div>
          <div>
            <Select v-model="selectedLoginProvider" class="mt-3" label="Select Login Provider*"
              aria-label="Select Login Provider*" placeholder="Select Login Provider"
              :options="computedLoginProviders.map((x) => ({ name: x.replaceAll('_', ' '), value: x }))"
              :helper-text="`Selected Login Provider: ${selectedLoginProvider.replaceAll('_', ' ')}`"
              :error="!selectedLoginProvider" />
          </div>
          <div>
            <Select v-if="showEmailFlow" v-model="emailFlowType" class="mt-3" label="Select Email Flow*"
              aria-label="Select Email Flow*" placeholder="Select Email Flow"
              :options="Object.values(EMAIL_FLOW).map((x) => ({ name: x, value: x }))"
              :helper-text="`Selected Email Flow: ${emailFlowType}`" :error="!emailFlowType" />
          </div>
          <div>
            <TextField v-model="login_hint" v-if="selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS"
              class="mt-3" label="Enter an email" aria-label="Enter an email" placeholder="Enter an email" required />
          </div>
          <div>
            <TextField v-model="login_hint" v-if="selectedLoginProvider === LOGIN_PROVIDER.SMS_PASSWORDLESS"
              class="mt-3" label="Eg: (+{cc}-{number})" aria-label="Eg: (+{cc}-{number})"
              placeholder="Eg: (+{cc}-{number})" required />
          </div>

        </div>
        <div class="flex justify-center mt-5">
          <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
            :disabled="!isLoginHintAvailable" type="button" block size="xl" pill @click="login">
            Login with {{ selectedLoginProvider.replaceAll("_", " ") }}
          </Button>
        </div>
      </Card>
    </div>
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4" v-else>
      <div class="absolute right-9 top-9">
        <!-- <p class="dashboard-chainid">Connect chainID : 0x5</p>
          <Button @click.stop="logout">
            <img :src="require('@/assets/logout.svg')" alt="logout" height="18" width="18" />
            Logout
          </Button> -->
        <button class="dashboard-action-logout" @click.stop="logout">
          <img src:="`/assets/logout.svg`" alt="logout" height="18" width="18" />
          Logout
        </button>
      </div>
      <div class="max-sm:w-full">
      </div>
      <div class="my-4"></div>
      <div class="grid grid-cols-3 gap-5">
        <Card class=" px-12 py-16 gird col-span-1">
          <div class="mb-4">
            <p class="btn-label">User info</p>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="getUserInfo">Get user info</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="getOpenloginState">Get openlogin state</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="getEd25519Key">Get Ed25519Key</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill v-if="isMFAEnabled()" @click="manageMFA">Manage MFA</Button>
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill v-else @click="enableMFA">Enable MFA</Button>
          </div>
          <div class="mb-4">
            <p class="btn-label">Signing</p>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="signMessage" :disabled="!ethereumPrivateKeyProvider?.provider">Sign test Eth
              Message</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="signMpcMessage" :disabled="!ethereumPrivateKeyProvider?.provider">Sign test
              Eth Message (MPC)</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="latestBlock" :disabled="!ethereumPrivateKeyProvider?.provider">Fetch latest
              block</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="addChain" :disabled="!ethereumPrivateKeyProvider?.provider">Add
              Goerli</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="switchChain" :disabled="!ethereumPrivateKeyProvider?.provider">Switch to
              Goerli</Button>
          </div>
          <div class="mb-4">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="signV1Message" :disabled="!ethereumPrivateKeyProvider?.provider">Sign Typed
              data v1 test msg</Button>
          </div>
        </Card>
        <Card class=" px-12 py-16 col-span-2" id="console">
          <h1 class="console-heading"></h1>
          <pre class="console-container"></pre>
          <div class="clear-console-btn">
            <Button :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']" type="button"
              block size="xl" pill @click="clearConsole">Clear console</Button>
          </div>
        </Card>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { EthereumSigningProvider as EthMpcPrivKeyProvider } from "@web3auth-mpc/ethereum-provider";
import * as bs58 from "bs58";
import { generatePrivate } from "@toruslabs/eccrypto";
import { ref, onBeforeMount, computed } from "vue";
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
  LANGUAGE_TYPE,
  SUPPORTED_KEY_CURVES,
} from "@toruslabs/openlogin-utils";
import loginConfig from "./lib/loginConfig";
import { keccak256 } from "ethereum-cryptography/keccak";
import { generateTSSEndpoints, getTSSEndpoints } from "./utils";
import { Card, Select, TextField, Button, Loader, Toggle } from "@toruslabs/vue-components";

const OPENLOGIN_PROJECT_IDS: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  [OPENLOGIN_NETWORK.MAINNET]: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
  [OPENLOGIN_NETWORK.TESTNET]: "BHr_dKcxC0ecKn_2dZQmQeNdjPgWykMkcodEHkVvPMo71qzOV6SgtoN8KCvFdLN7bf34JOm89vWQMLFmSfIo84A",
  [OPENLOGIN_NETWORK.AQUA]: "BM34K7ZqV3QwbDt0lvJFCdr4DxS9gyn7XZ2wZUaaf0Ddr71nLjPCNNYtXuGWxxc4i7ivYdgQzFqKlIot4IWrWCE",
  [OPENLOGIN_NETWORK.CYAN]: "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk",
  [OPENLOGIN_NETWORK.SAPPHIRE_DEVNET]: "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw",
  [OPENLOGIN_NETWORK.SAPPHIRE_MAINNET]: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
  [OPENLOGIN_NETWORK.CELESTE]: "openlogin",
};

const LANGUAGE: Record<LANGUAGE_TYPE, string> = {
  en: "en",
  de: "de",
  ja: "ja",
  ko: "ko",
  zh: "zh",
  es: "es",
  fr: "fr",
  pt: "pt",
  tr: "tr",
  nl: "nl",
};

const EMAIL_FLOW = {
  link: "link",
  code: "code",
};

const loading = ref(false);
const enableAllFactors = ref(false);
const privKey = ref("");
const ethereumPrivateKeyProvider = ref(null as EthMpcPrivKeyProvider | EthereumPrivateKeyProvider | null);
// const LOGIN_PROVIDER = ref(LOGIN_PROVIDER);
const selectedLoginProvider = ref(LOGIN_PROVIDER.GOOGLE as LOGIN_PROVIDER_TYPE);
const login_hint = ref("");
const isWhiteLabelEnabled = ref(false);
// const UX_MODE = ref(UX_MODE);
const selectedUxMode = ref(UX_MODE.REDIRECT as UX_MODE_TYPE);
const selectedLanguage = ref(LANGUAGE.en as LANGUAGE_TYPE);
// const LANGUAGE = ref(LANGUAGE);
// const OPENLOGIN_NETWORK = ref(OPENLOGIN_NETWORK);
// const BUILD_ENV = ref(BUILD_ENV);
const selectedOpenloginNetwork = ref(OPENLOGIN_NETWORK.SAPPHIRE_DEVNET);
const useMpc = ref(false);
const useWalletKey = ref(false);
const selectedBuildEnv = ref(BUILD_ENV.PRODUCTION);
const emailFlowType = ref(EMAIL_FLOW.code);
// const EMAIL_FLOW = ref(EMAIL_FLOW);
const enableEd25519Key = ref(false);
const isEnableMFA = ref(false);
const customSdkUrl = ref("");

const openloginInstance = ref({} as OpenLogin);

const init = async () => {
  const currentClientId = OPENLOGIN_PROJECT_IDS[selectedOpenloginNetwork.value];
  openloginInstance.value = new OpenLogin({
    clientId: currentClientId,
    network: selectedOpenloginNetwork.value,
    uxMode: selectedUxMode.value,
    whiteLabel: isWhiteLabelEnabled.value ? { ...whitelabel, defaultLanguage: selectedLanguage.value } : undefined,
    loginConfig: loginConfig,
    useMpc: useMpc.value,
    buildEnv: selectedBuildEnv.value,
    sdkUrl: customSdkUrl.value,
    mfaSettings: enableAllFactors.value
      ? {
        backUpShareFactor: { enable: true },
        deviceShareFactor: { enable: true },
        passwordFactor: { enable: true },
        socialBackupFactor: { enable: true },
      }
      : undefined,
  });
  openloginInstance.value?.init();
  if (storageAvailable("sessionStorage")) {
    const data = sessionStorage.getItem("state");
    if (data) {
      const state = JSON.parse(data);
      loading.value = state.loading;
      enableAllFactors.value = state.enableAllFactors;
      privKey.value = state.privKey;
      selectedLoginProvider.value = state.selectedLoginProvider;
      login_hint.value = state.login_hint;
      isWhiteLabelEnabled.value = state.isWhiteLabelEnabled;
      selectedUxMode.value = state.selectedUxMode;
      selectedLanguage.value = state.selectedLanguage;
      selectedOpenloginNetwork.value = state.selectedOpenloginNetwork;
      useMpc.value = state.useMpc;
      useWalletKey.value = state.useWalletKey;
      selectedBuildEnv.value = state.selectedBuildEnv;
      emailFlowType.value = state.emailFlowType;
      enableEd25519Key.value = state.enableEd25519Key;
      isEnableMFA.value = state.isEnableMFA;
      customSdkUrl.value = state.customSdkUrl;
    }
  }

  openloginInstance.value.options.uxMode = selectedUxMode.value;
  openloginInstance.value.options.whiteLabel = isWhiteLabelEnabled.value ? { ...whitelabel, defaultLanguage: selectedLanguage.value } : {};
  openloginInstance.value.options.mfaSettings = enableAllFactors.value
    ? {
      backUpShareFactor: { enable: true },
      deviceShareFactor: { enable: true },
      passwordFactor: { enable: true },
      socialBackupFactor: { enable: true },
    }
    : undefined;
  await openloginInstance.value.init();
  if (openloginInstance.value.state.factorKey) {
    useMpc.value = true;
    openloginInstance.value.options.useMpc = true;
    await openloginInstance.value.init();
  }
  if (openloginInstance.value.privKey || openloginInstance.value.state.factorKey || openloginInstance.value.state.walletKey) {
    const startTime = sessionStorage.getItem("startTime");
    if (startTime) {
      const loginTime = (Date.now() - parseInt(startTime, 10)) / 1000;
      console.log("Login time", `${loginTime}s`);
    }
    privKey.value = openloginInstance.value.privKey || (openloginInstance.value.state.factorKey as string) || (openloginInstance.value.state.walletKey as string);
    await setProvider(privKey.value);
  }
  loading.value = false;

};
init();

const computedLoginProviders = computed(() => Object.values(LOGIN_PROVIDER).filter((x) => x !== "jwt" && x !== "webauthn"));
const showEmailFlow = computed(() => selectedLoginProvider.value === LOGIN_PROVIDER.EMAIL_PASSWORDLESS);
const isLoginHintAvailable = computed(() => {
  if (selectedLoginProvider.value === LOGIN_PROVIDER.EMAIL_PASSWORDLESS || selectedLoginProvider.value === LOGIN_PROVIDER.SMS_PASSWORDLESS) {
    if (!login_hint.value) {
      return false;
    }
    if (selectedLoginProvider.value === LOGIN_PROVIDER.EMAIL_PASSWORDLESS && !login_hint.value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)) {
      return false;
    }
    if (selectedLoginProvider.value === LOGIN_PROVIDER.SMS_PASSWORDLESS && !(login_hint.value.startsWith("+") && login_hint.value.includes("-"))) {
      return false;
    }
  }
  return true;
});

const isLongLines = computed(() => ([LOGIN_PROVIDER.EMAIL_PASSWORDLESS, LOGIN_PROVIDER.SMS_PASSWORDLESS] as LOGIN_PROVIDER_TYPE[]).includes(selectedLoginProvider.value));

const login = async () => {
  try {
    loading.value = true;
    if (!openloginInstance.value) {
      loading.value = false;
      return;
    }
    openloginInstance.value.options.uxMode = selectedUxMode.value;
    openloginInstance.value.options.whiteLabel = isWhiteLabelEnabled.value ? { ...whitelabel, defaultLanguage: selectedLanguage.value } : {};
    openloginInstance.value.options.mfaSettings = enableAllFactors.value
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
      curve: enableEd25519Key.value ? SUPPORTED_KEY_CURVES.ED25519 : SUPPORTED_KEY_CURVES.SECP256K1,
      loginProvider: selectedLoginProvider.value,
      mfaLevel: isEnableMFA.value ? "optional" : "none",
      getWalletKey: useWalletKey.value,
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

    if (isLongLines.value) {
      openLoginObj.extraLoginOptions = {
        login_hint: login_hint.value,
      };
    }

    if (emailFlowType.value) {
      openLoginObj.extraLoginOptions = {
        ...openLoginObj.extraLoginOptions,
        flow_type: emailFlowType,
      };
    }

    console.log(openLoginObj, "OPENLOGIN");
    const startTime = Date.now();
    if (selectedUxMode.value === "redirect") sessionStorage.setItem("startTime", startTime.toString());
    await openloginInstance.value.login(openLoginObj);
    if (openloginInstance.value.privKey || openloginInstance.value.state.walletKey) {
      const loginTime = (Date.now() - startTime) / 1000;
      console.log("Login time", `${loginTime}s`);

      privKey.value = openloginInstance.value.privKey || openloginInstance.value.state.walletKey || "";
      await setProvider(privKey.value);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const setProvider = async (privKey: string) => {
  if (useMpc.value) {
    const { factorKey, tssPubKey, tssShareIndex, userInfo, tssShare, tssNonce, signatures } = openloginInstance.value.state;
    ethereumPrivateKeyProvider.value = new EthMpcPrivKeyProvider({
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
      const tssNodeEndpoints = getTSSEndpoints(selectedOpenloginNetwork.value as TORUS_SAPPHIRE_NETWORK_TYPE);
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
    await ethereumPrivateKeyProvider.value.setupProvider({ sign, getPublic });
  } else {
    ethereumPrivateKeyProvider.value = new EthereumPrivateKeyProvider({
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
    ethereumPrivateKeyProvider.value.setupProvider(privKey);
  }
};

const isMFAEnabled = () => {
  if (!openloginInstance.value || !openloginInstance.value.sessionId) return false;
  return openloginInstance.value.state?.userInfo?.isMfaEnabled || false;
};

const getUserInfo = async () => {
  if (!openloginInstance.value) {
    throw new Error("Openlogin is not available.");
  }
  const userInfo = openloginInstance.value.getUserInfo();
  printToConsole("User Info", userInfo);
};

const enableMFA = async () => {
  if (!openloginInstance.value || !openloginInstance.value.sessionId) {
    throw new Error("User not logged in");
  }
  await openloginInstance.value.enableMFA({});
};

const manageMFA = async () => {
  if (!openloginInstance.value || !openloginInstance.value.sessionId) {
    throw new Error("User not logged in");
  }
  await openloginInstance.value.manageMFA({});
};

const getOpenloginState = async () => {
  if (!openloginInstance.value) {
    throw new Error("Openlogin is not available.");
  }
  printToConsole("Openlogin State", openloginInstance.value.state);
};

const getEd25519Key = () => {
  if (!openloginInstance.value) {
    throw new Error("Openlogin is not available.");
  }
  const { sk } = getED25519Key(privKey.value);
  const base58Key = bs58.encode(sk);
  printToConsole("ED25519 Key", base58Key);
};

const signMessage = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  const signedMessage = await ethWeb3.signEthMessage(ethereumPrivateKeyProvider.value.provider);
  printToConsole("Signed Message", signedMessage);
};

const signMpcMessage = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  const signedMessage = await ethWeb3.ethSignTypedMessage(ethereumPrivateKeyProvider.value.provider);
  printToConsole("Signed Message", signedMessage);
};

const signV1Message = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  const signedMessage = await ethWeb3.signTypedData_v1(ethereumPrivateKeyProvider.value.provider);
  printToConsole("Signed Message", signedMessage);
};

const latestBlock = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  const block = await ethWeb3.fetchLatestBlock(ethereumPrivateKeyProvider.value.provider);
  printToConsole("Latest block", block);
};

const switchChain = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  try {
    await ethereumPrivateKeyProvider.value.provider.sendAsync({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x5" }],
    });
    printToConsole("Switched Chain", { ...ethereumPrivateKeyProvider.value.state, ...ethereumPrivateKeyProvider.value.config });
  } catch (error) {
    console.log("error while switching chain", error);
    printToConsole("Switched Chain Error", error);
  }
};

const addChain = async () => {
  if (!ethereumPrivateKeyProvider.value?.provider) throw new Error("provider not set");
  try {
    await ethereumPrivateKeyProvider.value.provider.sendAsync({
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
    printToConsole("Added chain", { ...ethereumPrivateKeyProvider.value.state, ...ethereumPrivateKeyProvider.value.config });
  } catch (error) {
    console.log("error while adding chain", error);
    printToConsole("Add chain error", error);
  }
};

const logout = async () => {
  if (!openloginInstance.value) {
    throw new Error("Openlogin is not available.");
  }
  await openloginInstance.value.logout();
  privKey.value = openloginInstance.value.privKey;
  ethereumPrivateKeyProvider.value = null;
  if (storageAvailable("sessionStorage")) sessionStorage.removeItem("state");
};

const printToConsole = (...args: unknown[]) => {
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
};

const clearConsole = () => {
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
};

onBeforeMount(() => {
  const data = {
    loading: loading.value,
    enableAllFactors: enableAllFactors.value,
    privKey: privKey.value,
    selectedLoginProvider: selectedLoginProvider.value,
    login_hint: login_hint.value,
    isWhiteLabelEnabled: isWhiteLabelEnabled.value,
    selectedUxMode: selectedUxMode.value,
    selectedLanguage: selectedLanguage.value,
    selectedOpenloginNetwork: selectedOpenloginNetwork.value,
    useMpc: useMpc.value,
    useWalletKey: useWalletKey.value,
    selectedBuildEnv: selectedBuildEnv.value,
    emailFlowType: emailFlowType.value,
    enableEd25519Key: enableEd25519Key.value,
    isEnableMFA: isEnableMFA.value,
    customSdkUrl: customSdkUrl.value,
  };
  Reflect.deleteProperty(data, "privKey");
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(data));
});

</script>
