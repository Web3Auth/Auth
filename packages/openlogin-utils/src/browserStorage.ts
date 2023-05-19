import { IStorage, storageAvailable } from "./utils";

export class MemoryStore implements IStorage {
  store: Record<string, string> = {};

  getItem(key: string): string {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

export class BrowserStorage {
  // eslint-disable-next-line no-use-before-define
  private static instance: BrowserStorage;

  public storage: IStorage;

  private _storeKey: string;

  private constructor(storeKey: string, storage: IStorage) {
    this.storage = storage;
    this._storeKey = storeKey;
    try {
      if (!storage.getItem(storeKey)) {
        this.resetStore();
      }
    } catch (error) {
      // Storage is not available
    }
  }

  static getInstance(key: string, storageKey: "session" | "local" = "local"): BrowserStorage {
    if (!this.instance) {
      let storage: IStorage;
      if (storageKey === "local" && storageAvailable("localStorage")) {
        storage = window.localStorage;
      } else if (storageKey === "session" && storageAvailable("sessionStorage")) {
        storage = window.sessionStorage;
      } else {
        storage = new MemoryStore();
      }

      this.instance = new this(key, storage);
    }
    return this.instance;
  }

  toJSON(): string {
    return this.storage.getItem(this._storeKey);
  }

  resetStore(): Record<string, unknown> {
    const currStore = this.getStore();
    this.storage.setItem(this._storeKey, JSON.stringify({}));
    return currStore;
  }

  getStore(): Record<string, unknown> {
    return JSON.parse(this.storage.getItem(this._storeKey) || "{}");
  }

  get<T>(key: string): T {
    const store = JSON.parse(this.storage.getItem(this._storeKey) || "{}");
    return store[key];
  }

  set<T>(key: string, value: T): void {
    const store = JSON.parse(this.storage.getItem(this._storeKey) || "{}");
    store[key] = value;
    this.storage.setItem(this._storeKey, JSON.stringify(store));
  }
}
