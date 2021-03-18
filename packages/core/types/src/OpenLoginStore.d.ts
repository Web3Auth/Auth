import { IStore } from "./IStore";
export default class OpenLoginStore {
    storage: IStore;
    private static instance;
    private constructor();
    static getInstance(): OpenLoginStore;
    toJSON(): string;
    resetStore(): Record<string, unknown>;
    getStore(): Record<string, unknown>;
    get<T>(key: string): T;
    set<T>(key: string, value: T): void;
}
