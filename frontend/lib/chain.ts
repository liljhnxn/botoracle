import { defineChain } from "viem";

export const botchainTestnet = defineChain({
  id: parseInt(process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID || "968", 10),
  name: "Botchain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Botchain Native Token",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.bohr.life"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BohrScan",
      url: process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.bohr.life",
    },
  },
  testnet: true,
});
