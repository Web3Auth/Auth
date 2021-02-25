import { storeKey } from "./constants";

export default class OpenLoginStore {
  public storage: Storage;

  private static instance: OpenLoginStore;

  private constructor(storage: Storage) {
    this.storage = storage;
    if (!localStorage.getItem(storeKey)) {
      this.resetStore();
    }
  }

  static getInstance(): OpenLoginStore {
    if (!this.instance) {
      this.instance = new this(localStorage);
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
