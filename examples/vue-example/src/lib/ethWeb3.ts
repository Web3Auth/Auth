import { SafeEventEmitterProvider } from "@web3auth/base";
import { BrowserProvider } from "ethers";

export const signEthMessage = async (provider: SafeEventEmitterProvider): Promise<string> => {
  const web3 = new BrowserProvider(provider as any);
  const accounts = await web3.listAccounts();
  // hex message
  const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
  const sign = await accounts[0]._legacySignMessage(message);
  return sign;
};

export const signTypedData_v1 = async (provider: SafeEventEmitterProvider): Promise<any> => {
  const web3 = new BrowserProvider(provider as any);
  const accounts = await web3.listAccounts();
  const domain = {
    name: "og-nft",
    version: "1",
    chainId: 1,
    verifyingContract: "0x",
  };
  const types = {
    Nft: [
      { name: "URI", type: "string" },
      { name: "price", type: "uint256" },
    ],
  };
  return accounts[0].signTypedData(domain, types, {
    URI: "",
    price: "1",
  });
};

export const ethSignTypedMessage = async (provider: SafeEventEmitterProvider) => {
  const web3 = new BrowserProvider(provider as any);
  const accounts = await web3.listAccounts();
  // hex message
  const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
  const sign = await accounts[0].signMessage(message);
  return sign;
}

export const fetchLatestBlock = async (provider: SafeEventEmitterProvider): Promise<any> => {
  const web3 = new BrowserProvider(provider as any);
  const block = await web3.getBlock("latest");
  return block;
};
