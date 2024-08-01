import { IStorage, storageAvailable } from "./utils";

export class MemoryStore implements IStorage {
  store: Map<string, string> = new Map();

  getItem(key: string): string {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export class BrowserStorage {
  private static instanceMap = new Map<string, BrowserStorage>();

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

  static getInstance(key: string, storageKey: "session" | "local" | "memory" = "local"): BrowserStorage {
    if (!this.instanceMap.has(key)) {
      let storage: IStorage;
      if (storageKey === "local" && storageAvailable("localStorage")) {
        storage = window.localStorage;
      } else if (storageKey === "session" && storageAvailable("sessionStorage")) {
        storage = window.sessionStorage;
      } else {
        storage = new MemoryStore();
      }

      this.instanceMap.set(key, new this(key, storage));
    }
    return this.instanceMap.get(key);
  }

  toJSON(): string {
    return this.storage.getItem(this._storeKey);
  }

  resetStore(): Record<string, unknown> {
    const currStore = this.getStore();
    this.storage.removeItem(this._storeKey);
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
