export const iframeDOMElementID = "openlogin-iframe";
export const storeKey = "openlogin_store";

export const UX_MODE = {
  POPUP: "popup",
  REDIRECT: "redirect",
} as const;

export type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];

export function storageAvailable(type: string): boolean {
  let storageExists = false;
  let storageLength = 0;
  let storage: Storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error) {
    return (
      error &&
      // everything except Firefox
      (error.code === 22 ||
        // Firefox
        error.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        error.name === "QuotaExceededErro r" ||
        // Firefox
        error.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storageExists &&
      storageLength !== 0
    );
  }
}

export const sessionStorageAvailable = storageAvailable("sessionStorage");
export const localStorageAvailable = storageAvailable("localStorage");
