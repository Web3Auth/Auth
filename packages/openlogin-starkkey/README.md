# OpenLogin Starkkey

OpenLogin is a plug & play authentication suite that combines the simplicity of passwordless authentication with the security of non-custodial public key infrastructure (PKI).

OpenLogin Starkkey helps developers generate stark curve friendly key

## Installation:-
- npm i @toruslabs/openlogin-starkkey
- npm i openlogin

## Usage

```ts

import { getStarkHDAccount, STARKNET_NETWORKS, starkEc } from "@toruslabs/openlogin-starkkey";
import OpenLogin from "openlogin";

const openloginSdk = new OpenLogin({
    clientId: "YOUR_PROJECT_ID",
    network: "testnet"
});

await openloginSdk.init();
// already logged in
if (openloginSdk.privKey) {
    // getting stark key pair from openlogin's key
    const account = getStarkHDAccount(openloginPrivKey, 1, STARKNET_NETWORKS.testnet);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
} else {
     // login here
     const privKey = await openlogin.login({
        // pass empty string '' as loginProvider to open default torus modal
        // with all default supported login providers or you can pass specific
        // login provider from available list to set as default.
        // for ex: google, facebook, twitter etc
        loginProvider: "",
        redirectUrl: `${window.location.origin}`,
    });
    
    // getting stark key pair from openlogin's key
    const account = getStarkHDAccount(privKey, 1, STARKNET_NETWORKS.testnet);
    const keyPair = starkEc.keyFromPrivate(account.privKey);
}

```

- Refer to examples/react-example folder in root folder of this repo to see a working example for this package.
