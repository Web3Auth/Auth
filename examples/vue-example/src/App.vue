<template>
  <nav class="bg-white sticky top-0 z-50 w-full z-20 top-0 start-0 border-gray-200 dark:border-gray-600">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="`/assets/web3auth.svg`" class="h-8" alt="W3A Logo" />
      </a>
      <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
        <Button v-if="privKey" class="dashboard-action-logout" type="button" block size="sm" pill @click="logout">Logout</Button>
      </div>
      <div id="navbar-sticky" class="items-center justify-between w-full md:flex md:w-auto md:order-1">
        <div class="max-sm:w-full">
          <h1 class="leading-tight text-3xl font-extrabold">demo-openlogin.web3auth.io</h1>
          <p v-if="privKey" class="leading-tight text-1xl">Openlogin Private key : {{ privKey }}</p>
        </div>
      </div>
    </div>
  </nav>
  <main class="flex-1 p-1">
    <div class="relative">
      <div v-if="privKey" class="flex-wrap items-center justify-between p-4">
        <div class="grid grid-cols-8 gap-0">
          <div class="col-span-1"></div>
          <Card class="px-4 py-4 gird col-span-2">
            <div class="mb-4">
              <p class="btn-label">User info</p>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="getUserInfo"
              >
                Get user info
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="getOpenloginState"
              >
                Get openlogin state
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="getEd25519Key"
              >
                Get Ed25519Key
              </Button>
            </div>
            <div class="mb-4">
              <Button
                v-if="isMFAEnabled()"
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="manageMFA"
              >
                Manage MFA
              </Button>
              <Button
                v-else
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="enableMFA"
              >
                Enable MFA
              </Button>
            </div>
            <div class="mb-4">
              <p class="btn-label">Signing</p>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="signMessage"
              >
                Sign test Eth Message
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="signMpcMessage"
              >
                Sign test Eth Message (MPC)
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="latestBlock"
              >
                Fetch latest block
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="addChain"
              >
                Add Sepolia
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="switchChain"
              >
                Switch to Sepolia
              </Button>
            </div>
            <div class="mb-4">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                :disabled="!ethereumPrivateKeyProvider?.provider"
                @click="signV1Message"
              >
                Sign Typed data v1 test msg
              </Button>
            </div>
          </Card>
          <Card id="console" class="px-4 py-4 col-span-4 overflow-y-auto">
            <pre
              class="whitespace-pre-line overflow-x-auto font-normal text-base leading-6 text-black break-words overflow-y-auto max-h-screen"
            ></pre>
            <div class="absolute top-2 right-8">
              <Button
                :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
                type="button"
                block
                size="md"
                pill
                @click="clearConsole"
              >
                Clear console
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <div v-else class="grid grid-cols-8 gap-0">
        <div class="col-span-0 sm:col-span-1 lg:col-span-2"></div>
        <Card class="h-auto px-12 py-16 col-span-8 sm:col-span-6 lg:col-span-4">
          <div class="leading-tight text-2xl font-extrabold">Login in with Openlogin</div>
          <div class="text-app-gray-500 mt-2">This demo show how to use Openlogin SDK to login and sign messages using Openlogin SDK.</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            <div class="flex items-start w-full gap-2 grid grid-cols-1">
              <Toggle id="mpc" v-model="useMpc" :show-label="true" :size="'small'" :label-disabled="'MPC'" :label-enabled="'MPC'" />
              <Toggle
                id="walletKey"
                v-model="useWalletKey"
                :show-label="true"
                :size="'small'"
                :label-disabled="'Wallet Key'"
                :label-enabled="'Wallet Key'"
              />
              <Toggle
                id="whitelabel"
                v-model="isWhiteLabelEnabled"
                :show-label="true"
                :size="'small'"
                :label-disabled="'Whitelabel'"
                :label-enabled="'Whitelabel'"
              />
            </div>
            <div>
              <div>
              <Select
                v-model="selectedBuildEnv"
                class="mt-3"
                label="Select Build Env*"
                aria-label="Select Build Env*"
                placeholder="Select Build Env"
                :options="Object.values(BUILD_ENV).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected Build Env: ${selectedBuildEnv}`"
                :error="!selectedBuildEnv"
              />
            </div>
            </div>
            <div class="flex items-start w-full gap-2">
              <Select
                v-model="selectedMFAFactors"
                class="mt-3"
                label="Select MFA Factors"
                aria-label="Select MFA Factor"
                placeholder="Select MFA Factor"
                :multiple="true"
                :show-check-box="true"
                :options="Object.entries(MFA_FACTOR).map(([k, v]) => ({ name: k, value: v }))"
              />
            </div>
            <div class="flex items-start w-full gap-2">
              <Select 
                v-model="selectedMandatoryMFAFactors" 
                class="mt-3" 
                label="Select Mandatory MFA Factors"
                aria-label="Select Mandatory MFA Factor" 
                placeholder="Select Mandatory MFA Factor" 
                :multiple="true" 
                :show-check-box="true"
                :options="Object.entries(MFA_FACTOR).filter(([_,v]) => selectedMFAFactors.includes(v as MFA_FACTOR_TYPE)).map(([k, v]) => ({ name: k, value: v }))"
              />
            </div>
            <Card
              v-if="isWhiteLabelEnabled"
              :shadow="false"
              :border="isWhiteLabelEnabled"
              class="col-span-1 sm:col-span-2 grid grid-cols-1 h-auto px-4 py-4"
            >
              <div class="leading-tight text-xl font-extrabold">Whitelabel Setting</div>
              <div class="text-app-gray-500 mt-2">Customize the look and feel of the Openlogin modal.</div>
              <div class="mt-3">
                <TextField
                  v-model="whitelabelConfig.appName"
                  class="mt-3"
                  label="Enter App Name"
                  aria-label="Enter App Name"
                  placeholder="Enter App Name"
                />
              </div>
              <div class="mt-3">
                <TextField
                  v-model="whitelabelConfig.appUrl"
                  class="mt-3"
                  label="Enter App URL"
                  aria-label="Enter App URL"
                  placeholder="Enter App URL"
                />
              </div>
              <div class="mt-3">
                <Select
                  v-model="whitelabelConfig.defaultLanguage"
                  class="mt-3"
                  label="Select Language*"
                  aria-label="Select Language*"
                  placeholder="Select Language"
                  :options="Object.values(languages)"
                  :helper-text="`Selected Language: ${whitelabelConfig.defaultLanguage}`"
                  :error="!whitelabelConfig.defaultLanguage"
                />
              </div>
              <div class="mt-3">
                <TextField
                  v-model="whitelabelConfig.logoLight"
                  class="mt-3"
                  label="Enter logo url"
                  aria-label="Enter logo url"
                  placeholder="Enter logo url"
                />
              </div>
              <div class="mt-3">
                <TextField
                  v-model="whitelabelConfig.logoDark"
                  class="mt-3"
                  label="Enter dark logo url"
                  aria-label="Enter dark logo url"
                  placeholder="Enter dark logo url"
                />
              </div>
              <div class="mt-3">
                <Toggle
                  id="useLogoLoader"
                  v-model="whitelabelConfig.useLogoLoader"
                  :show-label="true"
                  :size="'small'"
                  :label-disabled="'Use Logo Loader'"
                  :label-enabled="'Use Logo Loader'"
                />
              </div>
              <div class="mt-3">
                <TextField
                  :model-value="whitelabelConfig.theme?.primary"
                  class="mt-3"
                  label="Enter primary color"
                  aria-label="Enter primary color"
                  placeholder="Enter primary color"
                >
                  <template #endIconSlot>
                    <input
                      id="primary-color-picker"
                      class="color-picker"
                      type="color"
                      :value="whitelabelConfig.theme?.primary"
                      @input="
                        (e) => {
                          const color = (e.target as InputHTMLAttributes).value;
                          whitelabelConfig.theme = { ...whitelabelConfig.theme, primary: color };
                        }
                      "
                    />
                  </template>
                </TextField>
              </div>
              <div class="mt-3">
                <TextField
                  :model-value="whitelabelConfig.theme?.onPrimary"
                  class="mt-3"
                  label="Enter primary color"
                  aria-label="Enter primary color"
                  placeholder="Enter primary color"
                >
                  <template #endIconSlot>
                    <input
                      id="primary-color-picker"
                      class="color-picker"
                      type="color"
                      :value="whitelabelConfig.theme?.onPrimary"
                      @input="
                        (e) => {
                          const color = (e.target as InputHTMLAttributes).value;
                          whitelabelConfig.theme = { ...whitelabelConfig.theme, onPrimary: color };
                        }
                      "
                    />
                  </template>
                </TextField>
              </div>
            </Card>
            <div>
              <Select
                v-model="selectedMfaLevel"
                class="mt-3"
                label="Select MFA level"
                aria-label="Select MFA level"
                placeholder="Select MFA level"
                :options="Object.values(MFA_LEVELS).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected MFA Level: ${selectedMfaLevel}`"
              />
            </div>
            <div>
              <Select
                v-model="selectedCurve"
                class="mt-3"
                label="Select Curve Type"
                aria-label="Select Curve Type"
                placeholder="Select Curve Type"
                :options="Object.values(SUPPORTED_KEY_CURVES).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected Curve Type: ${selectedCurve}`"
              />
            </div>

            <div>
              <TextField
                v-model="customSdkUrl"
                class="mt-3"
                label="Enter custom url"
                aria-label="Enter custom url"
                placeholder="Enter custom url"
                required
              />
            </div>
            <div>
              <Select
                v-model="selectedOpenloginNetwork"
                class="mt-3"
                label="Select Openlogin Network*"
                aria-label="Select Openlogin Network*"
                placeholder="Select Openlogin Network"
                :options="Object.values(OPENLOGIN_NETWORK).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected Openlogin Network: ${selectedOpenloginNetwork}`"
                :error="!selectedOpenloginNetwork"
              />
            </div>
            <div>
              <Select
                v-model="selectedUxMode"
                class="mt-3"
                label="Select UX Mode*"
                aria-label="Select UX Mode*"
                placeholder="Select UX Mode"
                :options="Object.values(UX_MODE).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected UX Mode: ${selectedUxMode}`"
                :error="!selectedUxMode"
              />
            </div>
            <div>
              <Select
                v-model="selectedLoginProvider"
                class="mt-3"
                label="Select Login Provider*"
                aria-label="Select Login Provider*"
                placeholder="Select Login Provider"
                :options="computedLoginProviders.map((x) => ({ name: x.replaceAll('_', ' '), value: x }))"
                :helper-text="`Selected Login Provider: ${(selectedLoginProvider || '').replaceAll('_', ' ')}`"
                :error="!selectedLoginProvider"
              />
            </div>
            <div>
              <Select
                v-if="showEmailFlow"
                v-model="emailFlowType"
                class="mt-3"
                label="Select Email Flow*"
                aria-label="Select Email Flow*"
                placeholder="Select Email Flow"
                :options="Object.values(EMAIL_FLOW).map((x) => ({ name: x, value: x }))"
                :helper-text="`Selected Email Flow: ${emailFlowType}`"
                :error="!emailFlowType"
              />
            </div>
            <div>
              <TextField
                v-if="selectedLoginProvider === LOGIN_PROVIDER.EMAIL_PASSWORDLESS"
                v-model="login_hint"
                class="mt-3"
                label="Enter an email"
                aria-label="Enter an email"
                placeholder="Enter an email"
                required
              />
            </div>
            <div>
              <TextField
                v-if="selectedLoginProvider === LOGIN_PROVIDER.SMS_PASSWORDLESS"
                v-model="login_hint"
                class="mt-3"
                label="Eg: (+{cc}-{number})"
                aria-label="Eg: (+{cc}-{number})"
                placeholder="Eg: (+{cc}-{number})"
                required
              />
            </div>
          </div>
          <div class="flex justify-center mt-5">
            <Button
              :class="['w-full !h-auto group py-3 rounded-full flex items-center justify-center']"
              :disabled="!isLoginHintAvailable"
              type="button"
              block
              size="md"
              pill
              @click="login"
            >
              Login with {{ selectedLoginProvider.replaceAll("_", " ") }}
            </Button>
          </div>
        </Card>
        <div class="col-span-0 sm:col-span-1 lg:col-span-2"></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { TORUS_SAPPHIRE_NETWORK_TYPE } from "@toruslabs/constants";
import { generatePrivate } from "@toruslabs/eccrypto";
import OpenLogin from "@toruslabs/openlogin";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import {
  BUILD_ENV,
  BUILD_ENV_TYPE,
  LANGUAGE_TYPE,
  LANGUAGES,
  LOGIN_PROVIDER,
  LOGIN_PROVIDER_TYPE,
  LoginParams,
  MFA_FACTOR,
  MFA_FACTOR_TYPE,
  MFA_LEVELS,
  MFA_SETTINGS,
  MfaLevelType,
  OPENLOGIN_NETWORK,
  OPENLOGIN_NETWORK_TYPE,
  storageAvailable,
  SUPPORTED_KEY_CURVES,
  SUPPORTED_KEY_CURVES_TYPE,
  UX_MODE,
  UX_MODE_TYPE,
  WhiteLabelData,
} from "@toruslabs/openlogin-utils";
import { Client, getDKLSCoeff, setupSockets } from "@toruslabs/tss-client";
import { Button, Card, Select, TextField, Toggle } from "@toruslabs/vue-components";
import { EthereumSigningProvider } from "@web3auth/ethereum-mpc-provider";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import BN from "bn.js";
import bs58 from "bs58";
import { keccak256 } from "ethereum-cryptography/keccak";
import { computed, InputHTMLAttributes, ref, watch, watchEffect } from "vue";

import { CURVE, DELIMITERS } from "./constants";
import * as ethWeb3 from "./lib/ethWeb3";
import loginConfig from "./lib/loginConfig";
import whitelabel from "./lib/whitelabel";
import { generateTSSEndpoints, getTSSEndpoints } from "./utils";

const OPENLOGIN_PROJECT_IDS: Record<OPENLOGIN_NETWORK_TYPE, string> = {
  [OPENLOGIN_NETWORK.MAINNET]: "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA",
  [OPENLOGIN_NETWORK.TESTNET]: "BHr_dKcxC0ecKn_2dZQmQeNdjPgWykMkcodEHkVvPMo71qzOV6SgtoN8KCvFdLN7bf34JOm89vWQMLFmSfIo84A",
  [OPENLOGIN_NETWORK.AQUA]: "BM34K7ZqV3QwbDt0lvJFCdr4DxS9gyn7XZ2wZUaaf0Ddr71nLjPCNNYtXuGWxxc4i7ivYdgQzFqKlIot4IWrWCE",
  [OPENLOGIN_NETWORK.CYAN]: "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk",
  [OPENLOGIN_NETWORK.SAPPHIRE_DEVNET]: "BHgArYmWwSeq21czpcarYh0EVq2WWOzflX-NTK-tY1-1pauPzHKRRLgpABkmYiIV_og9jAvoIxQ8L3Smrwe04Lw",
  [OPENLOGIN_NETWORK.SAPPHIRE_MAINNET]: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
  [OPENLOGIN_NETWORK.CELESTE]: "openlogin",
};

const languages: { name: string; value: LANGUAGE_TYPE }[] = [
  { name: "English", value: LANGUAGES.en },
  { name: "German", value: LANGUAGES.de },
  { name: "Japanese", value: LANGUAGES.ja },
  { name: "Korean", value: LANGUAGES.ko },
  { name: "Mandarin", value: LANGUAGES.zh },
  { name: "Spanish", value: LANGUAGES.es },
  { name: "French", value: LANGUAGES.fr },
  { name: "Portuguese", value: LANGUAGES.pt },
  { name: "Dutch", value: LANGUAGES.nl },
  { name: "Turkish", value: LANGUAGES.tr },
];

const EMAIL_FLOW = {
  link: "link",
  code: "code",
} as const;

type EMAIL_FLOW_TYPE = (typeof EMAIL_FLOW)[keyof typeof EMAIL_FLOW];

const loading = ref(false);
const privKey = ref("");
const ethereumPrivateKeyProvider = ref<EthereumSigningProvider | EthereumPrivateKeyProvider | null>(null);
const selectedLoginProvider = ref<LOGIN_PROVIDER_TYPE>(LOGIN_PROVIDER.GOOGLE);
const login_hint = ref("");
const isWhiteLabelEnabled = ref(false);
const selectedUxMode = ref<UX_MODE_TYPE>(UX_MODE.REDIRECT);
const selectedOpenloginNetwork = ref<OPENLOGIN_NETWORK_TYPE>(OPENLOGIN_NETWORK.SAPPHIRE_DEVNET);
const useMpc = ref(false);
const useWalletKey = ref(false);
const selectedBuildEnv = ref<BUILD_ENV_TYPE>(BUILD_ENV.PRODUCTION);
const emailFlowType = ref<EMAIL_FLOW_TYPE>(EMAIL_FLOW.code);
const customSdkUrl = ref("");
const whitelabelConfig = ref<WhiteLabelData>(whitelabel);
const selectedMfaLevel = ref<MfaLevelType>(MFA_LEVELS.NONE);
const selectedCurve = ref<SUPPORTED_KEY_CURVES_TYPE>(SUPPORTED_KEY_CURVES.SECP256K1);
const selectedMFAFactors = ref<MFA_FACTOR_TYPE[]>([]);
const selectedMandatoryMFAFactors = ref<MFA_FACTOR_TYPE[]>([]);

const mfaSettings = computed(() => {
  if (!selectedMFAFactors.value?.length) return {};
  const mfaSettings: Record<string, MFA_SETTINGS> = {};
  selectedMFAFactors.value.forEach((factor) => {
    mfaSettings[factor] = { enable: true, mandatory: selectedMandatoryMFAFactors.value.includes(factor) };
  });
  return mfaSettings;
});

const openloginInstance = computed(() => {
  const currentClientId = OPENLOGIN_PROJECT_IDS[selectedOpenloginNetwork.value];
  const op = new OpenLogin({
    clientId: currentClientId,
    network: selectedOpenloginNetwork.value,
    uxMode: selectedUxMode.value,
    whiteLabel: isWhiteLabelEnabled.value ? (whitelabelConfig as WhiteLabelData) : undefined,
    loginConfig,
    useMpc: useMpc.value,
    buildEnv: selectedBuildEnv.value,
    sdkUrl: customSdkUrl.value,
    mfaSettings: mfaSettings.value,
  });
  op.init();
  return op;
});

const setProvider = async (_privKey: string) => {
  if (useMpc.value) {
    const { factorKey, tssPubKey, tssShareIndex, userInfo, tssShare, tssNonce, signatures } = openloginInstance.value.state;
    ethereumPrivateKeyProvider.value = new EthereumSigningProvider({
      config: {
        chainConfig: {
          chainId: "0x1",
          rpcTarget: `https://rpc.ankr.com/eth`,
          displayName: "Mainnet",
          blockExplorerUrl: "https://etherscan.io/",
          ticker: "ETH",
          tickerName: "Ethereum",
          chainNamespace: "eip155",
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

      const client = new Client(currentSession, clientIndex, partyIndexes, endpoints, sockets, share, tssPubKey, true, tss);
      const serverCoeffs: Record<number, string> = {};
      for (let i = 0; i < participatingServerDKGIndexes.length; i += 1) {
        const serverIndex = participatingServerDKGIndexes[i];
        serverCoeffs[serverIndex] = getDKLSCoeff(false, participatingServerDKGIndexes, tssShareIndex as number, serverIndex).toString("hex");
      }
      client.precompute({ signatures, server_coeffs: serverCoeffs });
      await client.ready();
      const { r, s, recoveryParam } = await client.sign(Buffer.from(msgHash).toString("base64"), true, "", "keccak256", {
        signatures,
      });
      await client.cleanup({ signatures, server_coeffs: serverCoeffs });
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
          blockExplorerUrl: "https://etherscan.io/",
          ticker: "ETH",
          tickerName: "Ethereum",
          chainNamespace: "eip155",
        },
      },
    });
    ethereumPrivateKeyProvider.value.setupProvider(_privKey);
  }
};

const init = async () => {
  if (storageAvailable("sessionStorage")) {
    const data = sessionStorage.getItem("state");
    if (data) {
      const state = JSON.parse(data);
      loading.value = state.loading;
      selectedMFAFactors.value = state.selectedMFAFactors;
      selectedMandatoryMFAFactors.value = state.selectedMandatoryMFAFactors;
      selectedLoginProvider.value = state.selectedLoginProvider;
      login_hint.value = state.login_hint;
      isWhiteLabelEnabled.value = state.isWhiteLabelEnabled;
      selectedUxMode.value = state.selectedUxMode;
      selectedOpenloginNetwork.value = state.selectedOpenloginNetwork;
      useMpc.value = state.useMpc;
      useWalletKey.value = state.useWalletKey;
      selectedBuildEnv.value = state.selectedBuildEnv;
      emailFlowType.value = state.emailFlowType;
      whitelabelConfig.value = state.whitelabelConfig;
      selectedCurve.value = state.selectedCurve;
      selectedMfaLevel.value = state.selectedMfaLevel;
      customSdkUrl.value = state.customSdkUrl;
    }
  }

  openloginInstance.value.options.uxMode = selectedUxMode.value;
  openloginInstance.value.options.whiteLabel = isWhiteLabelEnabled.value ? whitelabelConfig.value : undefined;
  openloginInstance.value.options.mfaSettings = mfaSettings.value;
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
    privKey.value =
      openloginInstance.value.privKey || (openloginInstance.value.state.factorKey as string) || (openloginInstance.value.state.walletKey as string);
    await setProvider(privKey.value);
  }
  loading.value = false;
};
init();
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

const isLongLines = computed(() =>
  ([LOGIN_PROVIDER.EMAIL_PASSWORDLESS, LOGIN_PROVIDER.SMS_PASSWORDLESS] as LOGIN_PROVIDER_TYPE[]).includes(selectedLoginProvider.value),
);

const login = async () => {
  try {
    loading.value = true;
    if (!openloginInstance.value) {
      loading.value = false;
      return;
    }
    openloginInstance.value.options.uxMode = selectedUxMode.value;
    openloginInstance.value.options.whiteLabel = isWhiteLabelEnabled.value ? whitelabelConfig.value : undefined;
    openloginInstance.value.options.mfaSettings = mfaSettings.value;
    // in popup mode (with third party cookies available) or if user is already logged in this function will
    // return priv key , in redirect mode or if third party cookies are blocked then priv key be injected to
    // sdk instance after calling init on redirect url page.
    const openLoginObj: LoginParams = {
      curve: selectedCurve.value,
      loginProvider: selectedLoginProvider.value,
      mfaLevel: selectedMfaLevel.value,
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
  const signedMessage = await ethWeb3.ethSignMpcMessage(ethereumPrivateKeyProvider.value.provider);
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
      params: [{ chainId: "0xaa36a7" }],
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
          chainId: "0xaa36a7",
          chainName: "sepolia",
          nativeCurrency: {
            name: "ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
          blockExplorerUrls: [`https://sepolia.etherscan.io/`],
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

watch(selectedMFAFactors, () => {
  selectedMandatoryMFAFactors.value = selectedMandatoryMFAFactors.value ? selectedMandatoryMFAFactors.value.filter((x) => selectedMFAFactors.value.includes(x)) : [];
});

watchEffect(() => {
  const data = {
    loading: loading.value,
    selectedMFAFactors: selectedMFAFactors.value,
    selectedMandatoryMFAFactors: selectedMandatoryMFAFactors.value,
    selectedLoginProvider: selectedLoginProvider.value,
    login_hint: login_hint.value,
    isWhiteLabelEnabled: isWhiteLabelEnabled.value,
    selectedUxMode: selectedUxMode.value,
    selectedOpenloginNetwork: selectedOpenloginNetwork.value,
    useMpc: useMpc.value,
    useWalletKey: useWalletKey.value,
    selectedBuildEnv: selectedBuildEnv.value,
    emailFlowType: emailFlowType.value,
    customSdkUrl: customSdkUrl.value,
    whitelabelConfig: { ...whitelabelConfig.value },
    selectedMfaLevel: selectedMfaLevel.value,
    selectedCurve: selectedCurve.value,
  };
  if (storageAvailable("sessionStorage")) sessionStorage.setItem("state", JSON.stringify(data));
});
</script>
