export declare function mimgGetIV(seed: string): BigInt;
export declare function mimcGetConstants(seed?: string, nRounds?: number): BigInt[];
export declare function mimcHash(_xL_in: any, _xR_in: any, _k: any): {
    xL: BigInt;
    xR: BigInt;
};
export declare function mimcMultiHash(arr: any[], key: any, numOutputs: number): BigInt[];
