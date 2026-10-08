import * as dotenv from "dotenv";
import { getPublicClient, getWalletClient } from "./client";
import { BOT_ORACLE_ABI } from "./abi";
import { CoinPriceSource } from "./sources/CoinPriceSource";
import { MockSource } from "./sources/MockSource";
import { DataSource } from "./sources/DataSource";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

// Ensure private key is properly formatted
function getPrivateKey(): `0x${string}` {
  const pk = process.env.ORACLE_PRIVATE_KEY;
  if (!pk) {
    console.error("ERROR: ORACLE_PRIVATE_KEY environment variable is not configured.");
    console.log("To run the oracle provider node, please set ORACLE_PRIVATE_KEY in your .env");
    process.exit(1);
  }
  return (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
}

async function runOracleNode() {
  console.log("==================================================");
  console.log("   BOTORACLE PROVIDER NODE DAEMON v1.0.0");
  console.log("==================================================");

  const contractAddress = (process.env.BOTORACLE_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_BOTORACLE_CONTRACT_ADDRESS) as `0x${string}`;

  if (!contractAddress) {
    console.warn("WARN: BOTORACLE_CONTRACT_ADDRESS is not set.");
    console.log("Please specify BOTORACLE_CONTRACT_ADDRESS in .env or run the node against deployed contract.");
    return;
  }

  const privateKey = getPrivateKey();
  const account = privateKeyToAccount(privateKey);
  const publicClient = getPublicClient();
  const walletClient = getWalletClient(privateKey);

  const pollIntervalMs = parseInt(process.env.ORACLE_POLL_INTERVAL || "30000", 10);

  // Initialize data sources
  const coinSource: DataSource = new CoinPriceSource();
  const mockSource: DataSource = new MockSource();

  console.log(`Provider Address:  ${account.address}`);
  console.log(`Contract Address:  ${contractAddress}`);
  console.log(`Network:           BOT Chain Mainnet (Chain ID 677)`);
  console.log(`RPC Endpoint:      ${process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai"}`);
  console.log(`Poll Interval:     ${pollIntervalMs / 1000}s`);
  console.log(`Primary Adapter:   ${coinSource.name}`);
  console.log("==================================================\n");

  // Verify Provider Registration
  try {
    const provider = await publicClient.readContract({
      address: contractAddress,
      abi: BOT_ORACLE_ABI,
      functionName: "getProvider",
      args: [account.address],
    });

    console.log(`[Status] Provider Name: "${provider.name}" | Active: ${provider.active} | Stake: ${provider.stake}`);
  } catch {
    console.log(`[Notice] Provider ${account.address} is not yet registered on-chain or contract is fresh.`);
  }

  // Poll loop
  const tick = async () => {
    try {
      console.log(`\n[${new Date().toISOString()}] Scanning active feeds on BotOracle...`);

      const feeds = await publicClient.readContract({
        address: contractAddress,
        abi: BOT_ORACLE_ABI,
        functionName: "getAllFeeds",
      });

      if (!feeds || feeds.length === 0) {
        console.log("No feeds registered in oracle contract yet.");
        return;
      }

      console.log(`Found ${feeds.length} feed(s) configured.`);

      for (const feed of feeds) {
        if (!feed.active) {
          console.log(`Feed #${feed.id} (${feed.symbol}) is inactive. Skipping.`);
          continue;
        }

        const roundId = feed.latestRoundId;
        if (roundId === 0n) {
          console.log(`Feed #${feed.id} (${feed.symbol}) has no active round yet.`);
          continue;
        }

        // Check round state
        const round = await publicClient.readContract({
          address: contractAddress,
          abi: BOT_ORACLE_ABI,
          functionName: "getRound",
          args: [feed.id, roundId],
        });

        const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        if (round.finalized) {
          console.log(`Feed #${feed.id} (${feed.symbol}) Round #${roundId} is already finalized.`);
          continue;
        }

        if (currentTimestamp > round.deadline) {
          console.log(`Feed #${feed.id} (${feed.symbol}) Round #${roundId} deadline has passed.`);
          continue;
        }

        // Check if provider already submitted
        const existingSubmission = await publicClient.readContract({
          address: contractAddress,
          abi: BOT_ORACLE_ABI,
          functionName: "getSubmission",
          args: [feed.id, roundId, account.address],
        });

        if (existingSubmission.exists) {
          console.log(`Feed #${feed.id} (${feed.symbol}) Round #${roundId}: Provider already submitted.`);
          continue;
        }

        // Fetch external value from adapter
        let rawPrice: number;
        try {
          rawPrice = await coinSource.getValue(feed.symbol);
        } catch {
          console.log(`Primary source failed for ${feed.symbol}, falling back to MockSource.`);
          rawPrice = await mockSource.getValue(feed.symbol);
        }

        // Validation against NaN, Infinity, or invalid values
        if (isNaN(rawPrice) || !isFinite(rawPrice) || rawPrice <= 0) {
          console.error(`Invalid price ${rawPrice} fetched for ${feed.symbol}. Aborting submission.`);
          continue;
        }

        // Scale to feed decimals
        const scaleFactor = 10 ** feed.decimals;
        const scaledValue = BigInt(Math.round(rawPrice * scaleFactor));

        console.log(`Submitting observation for Feed #${feed.id} (${feed.symbol}):`);
        console.log(`  Raw Price:       $${rawPrice.toFixed(4)}`);
        console.log(`  Scaled Value:    ${scaledValue.toString()} (${feed.decimals} decimals)`);

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: BOT_ORACLE_ABI,
          functionName: "submitValue",
          args: [feed.id, roundId, scaledValue],
        });

        console.log(`✓ Submitted! Tx Hash: ${hash}`);
        console.log(`  Explorer: https://scan.botchain.ai/tx/${hash}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Polling error:", msg);
    }
  };

  // Run initial tick and set interval
  await tick();
  setInterval(tick, pollIntervalMs);
}

runOracleNode().catch((err) => {
  console.error("Fatal node error:", err);
  process.exit(1);
});
