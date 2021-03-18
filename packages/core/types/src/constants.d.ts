export declare const iframeDOMElementID = "openlogin-iframe";
export declare const storeKey = "openlogin_store";
export declare const UX_MODE: {
    readonly POPUP: "popup";
    readonly REDIRECT: "redirect";
};
export declare type UX_MODE_TYPE = typeof UX_MODE[keyof typeof UX_MODE];
export declare function storageAvailable(type: string): boolean;
export declare const sessionStorageAvailable: boolean;
export declare const localStorageAvailable: boolean;
