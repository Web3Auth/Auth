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
            <i>{{ this.privKey }}</i>
            <button @click="logout">Logout</button>
          </div>
          <div>
            <button @click="getUserInfo">Get User Info</button>
            <button @click="getEd25519Key">Get Ed25519Key</button>

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
import * as bs58 from "bs58";
import OpenLogin from "openlogin";
import Vue from "vue";
const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";

const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "testnet",
  whiteLabel: {
    dark: true,
    theme: {
      primary: "#ffa500",
    },
  },
});

export default Vue.extend({
  name: "App",
  data() {
    return {
      loading: false,
      privKey: "",
    };
  },
  async mounted() {
    this.loading = true;
    await openlogin.init();
    this.privKey = openlogin.privKey;
    this.loading = false;
  },
  methods: {
    async login() {
      this.loading = true;
      try {
        await openlogin.login({
          // pass empty string '' as loginProvider to open default torus modal
          // with all default supported login providers or you can pass specific
          // login provider from available list to set as default.
          // for ex: google, facebook, twitter etc
          loginProvider: "",
          redirectUrl: `${window.origin}`,
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
      } catch (error) {
        console.log("error", error);
      } finally {
        this.loading = false;
      }
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

    async logout() {
      await openlogin.logout({});
      this.privKey = openlogin.privKey;
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
