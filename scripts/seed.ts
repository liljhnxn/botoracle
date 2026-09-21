import { ethers } from "hardhat";

async function main() {
  console.log("Seeding BotOracle with feeds, providers, and sample rounds...");

  const signers = await ethers.getSigners();
  const [admin, p1, p2, p3, p4] = signers;

  const BotOracleFactory = await ethers.getContractFactory("BotOracle");
  const oracle = await BotOracleFactory.deploy(admin.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`BotOracle deployed at: ${oracleAddress}`);

  // Fund rewards
  await oracle.connect(admin).fundRewardPool({ value: ethers.parseEther("5.0") });

  // Create initial feeds
  console.log("Creating feeds...");
  // 1. BTC/USD (8 decimals, 1hr heartbeat, min 3 providers, 500 bps = 5%)
  await oracle.connect(admin).createFeed("Bitcoin / USD", "BTC/USD", 8, 3600, 3, 500);
  // 2. ETH/USD (8 decimals, 1hr heartbeat, min 3 providers, 500 bps = 5%)
  await oracle.connect(admin).createFeed("Ethereum / USD", "ETH/USD", 8, 3600, 3, 500);
  // 3. BOT/USD (8 decimals, 1hr heartbeat, min 3 providers, 500 bps = 5%)
  await oracle.connect(admin).createFeed("Botchain Native / USD", "BOT/USD", 8, 3600, 3, 500);

  // Register providers
  console.log("Registering sample providers...");
  const stakeAmount = ethers.parseEther("2.0");
  if (p1) await oracle.connect(p1).registerProvider("Apex Node", "https://apexnode.io/meta.json", { value: stakeAmount });
  if (p2) await oracle.connect(p2).registerProvider("Chronos Oracle", "https://chronos.network/meta.json", { value: stakeAmount });
  if (p3) await oracle.connect(p3).registerProvider("Bohr Telemetry", "https://bohrtelemetry.org", { value: stakeAmount });
  if (p4) await oracle.connect(p4).registerProvider("Nexus Validator", "https://nexus-oracle.io", { value: stakeAmount });

  // Start round for BTC/USD
  console.log("Starting Round 1 for BTC/USD...");
  await oracle.connect(admin).startRound(1);

  // Submit values: 11243000000000n, 11247000000000n, 11251000000000n
  if (p1) await oracle.connect(p1).submitValue(1, 1, 11243000000000n);
  if (p2) await oracle.connect(p2).submitValue(1, 1, 11247000000000n);
  if (p3) await oracle.connect(p3).submitValue(1, 1, 11251000000000n);

  // Finalize round 1
  console.log("Finalizing Round 1...");
  await oracle.connect(admin).finalizeRound(1, 1);

  const [price, updatedAt, roundId] = await oracle.getLatestAnswer(1);
  console.log(`✓ BTC/USD Verified Answer: ${Number(price) / 1e8} USD (Round #${roundId})`);

  // Start round for ETH/USD
  console.log("Starting Round 1 for ETH/USD...");
  await oracle.connect(admin).startRound(2);
  if (p1) await oracle.connect(p1).submitValue(2, 1, 412050000000n); // 4120.50
  if (p2) await oracle.connect(p2).submitValue(2, 1, 412500000000n); // 4125.00
  if (p3) await oracle.connect(p3).submitValue(2, 1, 412200000000n); // 4122.00
  await oracle.connect(admin).finalizeRound(2, 1);
  const [ethPrice] = await oracle.getLatestAnswer(2);
  console.log(`✓ ETH/USD Verified Answer: ${Number(ethPrice) / 1e8} USD`);

  console.log("Seed complete!");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exitCode = 1;
});
