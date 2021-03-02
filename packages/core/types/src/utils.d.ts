export declare function documentReady(): Promise<void>;
export declare function getHashQueryParams(replaceUrl?: boolean): Record<string, string>;
export declare function awaitReq<T>(id: string): Promise<T>;
export declare function constructURL(params: {
    baseURL: string;
    queryParams?: Record<string, unknown>;
    hashParams?: Record<string, unknown>;
}): string;
export declare type Maybe<T> = Partial<T> | null | undefined;
