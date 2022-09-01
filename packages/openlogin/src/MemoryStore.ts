import { IStore } from "./IStore";

export class MemoryStore implements IStore {
  store: Record<string, string> = {};

  getItem(key: string): string {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}
