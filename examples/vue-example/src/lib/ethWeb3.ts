import type { Signer } from "ethers";

export const personalSign = async (signer: Signer): Promise<string> => {
  const message = "Hello, world!";
  return signer.signMessage(message);
};

export const signTypedData_v1 = async (signer: Signer): Promise<string> => {
  const domain = {
    name: "og-nft",
    version: "1",
    chainId: 1,
    verifyingContract: "0x0000000000000000000000000000000000000000",
  };
  const types = {
    Nft: [
      { name: "URI", type: "string" },
      { name: "price", type: "uint256" },
    ],
  };
  return signer.signTypedData(domain, types, {
    URI: "",
    price: "1",
  });
};
