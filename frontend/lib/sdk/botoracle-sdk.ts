import { createPublicClient, http, formatUnits } from "viem";
import { activeBotchain } from "../chain";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../contracts/botoracle";

export interface BotOraclePriceData {
  feedId: bigint;
  name: string;
  symbol: string;
  answer: bigint;
  formattedPrice: string;
  decimals: number;
  updatedAt: Date;
  roundId: bigint;
  isStale: boolean;
  heartbeat: bigint;
}

/**
 * Reads the latest verified price from BotOracle.
 * @param feedId Numeric or bigint feed ID (e.g. 1)
 * @param contractAddress Optional contract address override
 */
export async function getBotOraclePrice(
  feedId: number | bigint,
  contractAddress: `0x${string}` = BOTORACLE_ADDRESS
): Promise<BotOraclePriceData> {
  const client = createPublicClient({
    chain: activeBotchain,
    transport: http(),
  });

  const bigFeedId = BigInt(feedId);

  const [answer, updatedAt, roundId] = await client.readContract({
    address: contractAddress,
    abi: BOTORACLE_ABI,
    functionName: "getLatestAnswer",
    args: [bigFeedId],
  });

  const feed = await client.readContract({
    address: contractAddress,
    abi: BOTORACLE_ABI,
    functionName: "getFeed",
    args: [bigFeedId],
  });

  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const isStale = nowSec - updatedAt > feed.heartbeat;

  return {
    feedId: bigFeedId,
    name: feed.name,
    symbol: feed.symbol,
    answer,
    formattedPrice: formatUnits(answer, feed.decimals),
    decimals: feed.decimals,
    updatedAt: new Date(Number(updatedAt) * 1000),
    roundId,
    isStale,
    heartbeat: feed.heartbeat,
  };
}
