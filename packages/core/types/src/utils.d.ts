export declare function documentReady(): Promise<void>;
export declare function getHashQueryParams(replaceUrl?: boolean): Record<string, string>;
export declare function awaitReq(reqId: string): Promise<Record<string, unknown>>;
export declare function constructURL(baseURL: string, queryParams: Record<string, unknown>, hashParams?: Record<string, unknown>): string;
export declare type Maybe<T> = Partial<T> | null | undefined;
