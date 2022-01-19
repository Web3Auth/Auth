import { SafeEventEmitterProvider } from "@web3auth/base";
import Web3 from "web3";

export const signEthMessage = async (provider: SafeEventEmitterProvider): Promise<string> => {
  const web3 = new Web3(provider as any);
  const accounts = await web3.eth.getAccounts();
  // hex message
  const message = "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad";
  const sign = await web3.eth.sign(message, accounts[0]);
  return sign;
};

export const signTypedData_v1 = async (provider: SafeEventEmitterProvider): Promise<any> => {
  const web3 = new Web3(provider as any);
  const accounts = await web3.eth.getAccounts();

  const typedData = [
    {
      type: "string",
      name: "message",
      value: "Hi, Alice!",
    },
    {
      type: "uint8",
      name: "value",
      value: 10,
    },
  ];
  return (web3.currentProvider as any)?.sendAsync({
    method: "eth_signTypedData",
    params: [typedData, accounts[0]],
    from: accounts[0],
  });
};

export const fetchLatestBlock = async (provider: SafeEventEmitterProvider): Promise<any> => {
  const web3 = new Web3(provider as any);
  const block = await web3.eth.getBlock("latest");
  return block;
};
