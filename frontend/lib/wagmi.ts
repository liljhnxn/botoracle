import { http, createConfig, injected } from "wagmi";
import { botchain } from "./chain";

export const config = createConfig({
  chains: [botchain],
  connectors: [injected()],
  transports: {
    [botchain.id]: http(process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
