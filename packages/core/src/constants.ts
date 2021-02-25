export const iframeDOMElementID = "openlogin-iframe";
export const storeKey = "openlogin_store";

export const UX_MODE = {
  POPUP: "popup",
  REDIRECT: "redirect",
} as const;

export type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];
