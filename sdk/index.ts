import { createPublicClient, http, defineChain, formatUnits } from "viem";

export const botchainTestnet = defineChain({
  id: 968,
  name: "Botchain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Botchain Native Token",
    symbol: "BOT",
  },
  rpcUrls: {
    default: { http: ["https://rpc.bohr.life"] },
    public: { http: ["https://rpc.bohr.life"] },
  },
  blockExplorers: {
    default: { name: "BohrScan", url: "https://scan.bohr.life" },
  },
});

export const BOT_ORACLE_ABI_MINIMAL = [
  {
    inputs: [{ name: "feedId", type: "uint256" }],
    name: "getLatestAnswer",
    outputs: [
      { name: "answer", type: "int256" },
      { name: "updatedAt", type: "uint256" },
      { name: "roundId", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "feedId", type: "uint256" }],
    name: "getFeed",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "decimals", type: "uint8" },
          { name: "heartbeat", type: "uint256" },
          { name: "minProviders", type: "uint256" },
          { name: "deviationThreshold", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "latestRoundId", type: "uint256" },
          { name: "latestAnswer", type: "int256" },
          { name: "latestUpdatedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface OraclePriceResponse {
  feedId: bigint;
  symbol: string;
  rawPrice: bigint;
  formattedPrice: string;
  decimals: number;
  updatedAt: Date;
  roundId: bigint;
  isStale: boolean;
  heartbeatSeconds: bigint;
}

/**
 * Reads the latest verified oracle answer from BotOracle on Botchain.
 * @param feedId The unique feed identifier (e.g. 1 for BTC/USD).
 * @param contractAddress The BotOracle contract address.
 * @param rpcUrl Optional custom RPC URL (defaults to https://rpc.bohr.life).
 */
export async function getBotOraclePrice(
  feedId: number | bigint,
  contractAddress: `0x${string}`,
  rpcUrl = "https://rpc.bohr.life"
): Promise<OraclePriceResponse> {
  const client = createPublicClient({
    chain: botchainTestnet,
    transport: http(rpcUrl),
  });

  const bigFeedId = BigInt(feedId);

  const [answer, updatedAt, roundId] = await client.readContract({
    address: contractAddress,
    abi: BOT_ORACLE_ABI_MINIMAL,
    functionName: "getLatestAnswer",
    args: [bigFeedId],
  });

  const feed = await client.readContract({
    address: contractAddress,
    abi: BOT_ORACLE_ABI_MINIMAL,
    functionName: "getFeed",
    args: [bigFeedId],
  });

  const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const age = currentTimestamp - updatedAt;
  const isStale = age > feed.heartbeat;

  return {
    feedId: bigFeedId,
    symbol: feed.symbol,
    rawPrice: answer,
    formattedPrice: formatUnits(answer, feed.decimals),
    decimals: feed.decimals,
    updatedAt: new Date(Number(updatedAt) * 1000),
    roundId,
    isStale,
    heartbeatSeconds: feed.heartbeat,
  };
}
