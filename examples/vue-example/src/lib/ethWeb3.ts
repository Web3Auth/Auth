import type { WalletClient } from "viem";

export const personalSign = async (client: WalletClient): Promise<string> => {
  if (!client.account) throw new Error("account not set on client");
  return client.signMessage({ account: client.account, message: "Hello, world!" });
};

export const signTypedData_v4 = async (client: WalletClient): Promise<string> => {
  if (!client.account) throw new Error("account not set on client");
  return client.signTypedData({
    account: client.account,
    domain: {
      name: "og-nft",
      version: "1",
      chainId: 1,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    types: {
      Nft: [
        { name: "URI", type: "string" },
        { name: "price", type: "uint256" },
      ],
    },
    primaryType: "Nft",
    message: {
      URI: "",
      price: 1n,
    },
  });
};
