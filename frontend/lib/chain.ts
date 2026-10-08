import { defineChain } from "viem";

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
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BotScan",
      url: process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.botchain.ai",
    },
  },
  testnet: false,
});

export const botchainMainnet = botchain;
export const activeBotchain = botchain;
