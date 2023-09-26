import { TORUS_SAPPHIRE_NETWORK } from "@toruslabs/openlogin-utils";
import { TORUS_SAPPHIRE_NETWORK_TYPE } from "@toruslabs/constants";

export const SAPPHIRE_NETWORK_URLS: Record<TORUS_SAPPHIRE_NETWORK_TYPE, string[]> = {
  [TORUS_SAPPHIRE_NETWORK.SAPPHIRE_DEVNET]: [
    "https://sapphire-dev-2-1.authnetwork.dev",
    "https://sapphire-dev-2-2.authnetwork.dev",
    "https://sapphire-dev-2-3.authnetwork.dev",
    "https://sapphire-dev-2-4.authnetwork.dev",
    "https://sapphire-dev-2-5.authnetwork.dev",
  ],
  [TORUS_SAPPHIRE_NETWORK.SAPPHIRE_MAINNET]: [
    "https://sapphire-1.auth.network",
    "https://sapphire-2.auth.network",
    "https://sapphire-3.auth.network",
    "https://sapphire-4.auth.network",
    "https://sapphire-5.auth.network",
  ],
};

export const getTSSEndpoints = (sapphireNetwork: TORUS_SAPPHIRE_NETWORK_TYPE) => {
  const endpoints = SAPPHIRE_NETWORK_URLS[sapphireNetwork];
  if (!endpoints || endpoints.length === 0) {
    throw new Error(`Unsupported network: ${sapphireNetwork}`);
  }

  return endpoints.map((e) => {
    return `${e}/tss`;
  });
};

export const generateTSSEndpoints = (tssNodeEndpoints: string[], parties: number, clientIndex: number) => {
  const endpoints: string[] = [];
  const tssWSEndpoints: string[] = [];
  const partyIndexes: number[] = [];
  for (let i = 0; i < parties; i++) {
    partyIndexes.push(i);
    if (i === clientIndex) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      endpoints.push(null as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tssWSEndpoints.push(null as any);
    } else {
      endpoints.push(tssNodeEndpoints[i]);
      tssWSEndpoints.push(new URL(tssNodeEndpoints[i]).origin);
    }
  }
  return { endpoints, tssWSEndpoints, partyIndexes };
};