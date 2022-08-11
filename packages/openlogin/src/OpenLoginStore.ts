import { storeKey } from "./constants";
import { IStore } from "./IStore";
import { MemoryStore } from "./MemoryStore";
import { localStorageAvailable, sessionStorageAvailable } from "./utils";

export default class OpenLoginStore {
  // eslint-disable-next-line no-use-before-define
  private static instance: OpenLoginStore;

  public storage: IStore;

  private constructor(storage: IStore) {
    this.storage = storage;
    try {
      if (!storage.getItem(storeKey)) {
        this.resetStore();
      }
    } catch (error) {
      // Storage is not available
    }
  }

  static getInstance(storageKey: "session" | "local" = "local"): OpenLoginStore {
    if (!this.instance) {
      let storage: Storage | MemoryStore = new MemoryStore();
      if (storageKey === "local" && localStorageAvailable) {
        storage = localStorage;
      }
      if (storageKey === "session" && sessionStorageAvailable) {
        storage = sessionStorage;
      }
      this.instance = new this(storage);
    }
    return this.instance;
  }

  toJSON(): string {
    return this.storage.getItem(storeKey);
  }

  resetStore(): Record<string, unknown> {
    const currStore = this.getStore();
    this.storage.setItem(storeKey, JSON.stringify({}));
    return currStore;
  }

  getStore(): Record<string, unknown> {
    return JSON.parse(this.storage.getItem(storeKey));
  }

  get<T>(key: string): T {
    const store = JSON.parse(this.storage.getItem(storeKey));
    return store[key];
  }

  set<T>(key: string, value: T): void {
    const store = JSON.parse(this.storage.getItem(storeKey));
    store[key] = value;
    this.storage.setItem(storeKey, JSON.stringify(store));
  }
}
