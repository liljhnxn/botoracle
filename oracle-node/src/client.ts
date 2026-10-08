import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

dotenv.config();

export const botchain = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Botchain Native Token",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
    public: {
      http: [process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotScan",
      url: "https://scan.botchain.ai",
    },
  },
});

export const botchainMainnet = botchain;

export function getPublicClient(rpcUrl?: string) {
  return createPublicClient({
    chain: botchain,
    transport: http(rpcUrl || process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"),
  });
}

export function getWalletClient(privateKeyHex: `0x${string}`, rpcUrl?: string) {
  const account = privateKeyToAccount(privateKeyHex);
  return createWalletClient({
    account,
    chain: botchain,
    transport: http(rpcUrl || process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"),
  });
}
