import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

export const botchainTestnet = defineChain({
  id: 968,
  name: "Botchain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Botchain Native Token",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life"],
    },
    public: {
      http: [process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BohrScan",
      url: "https://scan.bohr.life",
    },
  },
});

export function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: botchainTestnet,
    transport: http(rpcUrl || process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life"),
  });
}

export function getWalletClient(privateKeyHex: `0x${string}`, rpcUrl?: string) {
  const account = privateKeyToAccount(privateKeyHex);
  return createWalletClient({
    account,
    chain: botchainTestnet,
    transport: http(rpcUrl || process.env.BOTCHAIN_RPC_URL || "https://rpc.bohr.life"),
  });
}
