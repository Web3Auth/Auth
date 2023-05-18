import OpenLogin from "@toruslabs/openlogin";
import { MFA_FACTOR, WhiteLabelData } from "@toruslabs/openlogin-utils";

import loginConfig from "./loginConfig";

export const YOUR_PROJECT_ID = "BJ6l3_kIQiy6YVL7zDlCcEAvGpGukwFgp-C_0WvNI_fAEeIaoVRLDrV5OjtbZr_zJxbyXFsXMT-yhQiUNYvZWpo";

export function getOpenLoginInstance(whiteLabel?: WhiteLabelData) {
  return new OpenLogin({
    // your clientId aka projectId , get it from https://dashboard.web3auth.io
    // clientId is not required for localhost, you can set it to any string
    // for development
    clientId: YOUR_PROJECT_ID,
    network: "testnet",
    uxMode: "redirect",
    sdkUrl: "https://testing.openlogin.com",
    whiteLabel,
    loginConfig,
    // mfaSettings: {
    //   [MFA_FACTOR.DEVICE]: {
    //     enable: true,
    //   },
    //   [MFA_FACTOR.PASSWORD]: {
    //     enable: true,
    //   },
    // },
  });
}
