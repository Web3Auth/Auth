export declare function keccak256(str: string): string;
export declare function mimgGetIV(seed: string): any;
export declare function mimcGetConstants(seed?: string, nRounds?: number): any[];
export declare function mimcHash(_xL_in: any, _xR_in: any, _k: any): {
    xL: BigInt;
    xR: BigInt;
};
export declare function mimcMultiHash(arr: any[], key: any, numOutputs: any): BigInt[];
