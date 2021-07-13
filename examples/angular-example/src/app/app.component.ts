import { Component } from "@angular/core";
import OpenLogin from "openlogin";
import * as bs58 from "bs58";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
const YOUR_PROJECT_ID = "BOUSb58ft1liq2tSVGafkYohnNPgnl__vAlYSk3JnpfW281kApYsw30BG1-nGpmy8wK-gT3dHw2D_xRXpTEdDBE";

const openlogin = new OpenLogin({
  // your clientId aka projectId , get it from https://developer.tor.us
  // clientId is not required for localhost, you can set it to any string
  // for development
  clientId: YOUR_PROJECT_ID,
  network: "testnet",
});

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  loading = false;
  privKey = "";

  async ngAfterContentInit() {
    this.loading = true;
    try {
      await openlogin.init();
      // privKey will exist only when user is successfully logged in
      // else it will an empty string
      // privKey is removed when user is logged out
      this.privKey = openlogin.privKey;
    } catch (error) {
      console.log("error while initializing", error);
    } finally {
      this.loading = false;
    }
  }
  async login(_: Event) {
    this.loading = true;
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
        const userInfo = await openlogin.getUserInfo();
        this.printToConsole(userInfo);
      }

      this.loading = false;
    } catch (error) {
      console.log("error", error);
      this.loading = false;
    }
  }

  getUserInfo = async (_: Event) => {
    const userInfo = await openlogin.getUserInfo();
    this.printToConsole(userInfo);
  };

  getEd25519Key = async (_: Event) => {
    const { sk } = getED25519Key(openlogin.privKey);
    const base58Key = bs58.encode(sk);
    this.printToConsole(base58Key);
  };

  logout = async (_: Event) => {
    this.loading = true;
    try {
      await openlogin.logout({});
      // privKey will be empty after logout.
      this.privKey = openlogin.privKey;
    } catch (error) {
      this.printToConsole("error while logout", error);
    } finally {
      this.loading = false;
    }
  };

  printToConsole = (...args: unknown[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  };
}
