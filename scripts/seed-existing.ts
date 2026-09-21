import { ethers } from "hardhat";

async function main() {
  const oracleAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log(`Connecting to BotOracle at ${oracleAddress}...`);

  const oracle = await ethers.getContractAt("BotOracle", oracleAddress);
  const signers = await ethers.getSigners();
  const [admin, p1, p2, p3, p4] = signers;

  // Fund rewards
  console.log("Funding reward pool...");
  await oracle.connect(admin).fundRewardPool({ value: ethers.parseEther("10.0") });

  // Create feeds
  console.log("Creating feeds...");
  // Feed 1: BTC/USD
  await oracle.connect(admin).createFeed("Bitcoin / USD", "BTC/USD", 8, 3600, 3, 500);
  // Feed 2: ETH/USD
  await oracle.connect(admin).createFeed("Ethereum / USD", "ETH/USD", 8, 3600, 3, 500);
  // Feed 3: BOT/USD
  await oracle.connect(admin).createFeed("Botchain Native / USD", "BOT/USD", 8, 3600, 3, 500);

  // Register providers
  console.log("Registering providers...");
  const stakeAmount = ethers.parseEther("2.0");
  if (p1) await oracle.connect(p1).registerProvider("Apex Node", "https://apexnode.io/meta.json", { value: stakeAmount });
  if (p2) await oracle.connect(p2).registerProvider("Chronos Oracle", "https://chronos.network/meta.json", { value: stakeAmount });
  if (p3) await oracle.connect(p3).registerProvider("Bohr Telemetry", "https://bohrtelemetry.org", { value: stakeAmount });
  if (p4) await oracle.connect(p4).registerProvider("Nexus Validator", "https://nexus-oracle.io", { value: stakeAmount });

  // Start round for BTC/USD
  console.log("Starting and submitting Round 1 for BTC/USD...");
  await oracle.connect(admin).startRound(1);
  if (p1) await oracle.connect(p1).submitValue(1, 1, 11243000000000n); // 112,430.00
  if (p2) await oracle.connect(p2).submitValue(1, 1, 11247000000000n); // 112,470.00
  if (p3) await oracle.connect(p3).submitValue(1, 1, 11251000000000n); // 112,510.00
  await oracle.connect(admin).finalizeRound(1, 1);
  const [btcPrice] = await oracle.getLatestAnswer(1);
  console.log(`✓ BTC/USD Verified Answer: $${Number(btcPrice) / 1e8}`);

  // Start round for ETH/USD
  console.log("Starting and submitting Round 1 for ETH/USD...");
  await oracle.connect(admin).startRound(2);
  if (p1) await oracle.connect(p1).submitValue(2, 1, 412050000000n); // 4,120.50
  if (p2) await oracle.connect(p2).submitValue(2, 1, 412200000000n); // 4,122.00
  if (p3) await oracle.connect(p3).submitValue(2, 1, 412500000000n); // 4,125.00
  await oracle.connect(admin).finalizeRound(2, 1);
  const [ethPrice] = await oracle.getLatestAnswer(2);
  console.log(`✓ ETH/USD Verified Answer: $${Number(ethPrice) / 1e8}`);

  // Start round for BOT/USD
  console.log("Starting and submitting Round 1 for BOT/USD...");
  await oracle.connect(admin).startRound(3);
  if (p1) await oracle.connect(p1).submitValue(3, 1, 145000000n); // 1.45
  if (p2) await oracle.connect(p2).submitValue(3, 1, 146000000n); // 1.46
  if (p3) await oracle.connect(p3).submitValue(3, 1, 145500000n); // 1.455
  await oracle.connect(admin).finalizeRound(3, 1);
  const [botPrice] = await oracle.getLatestAnswer(3);
  console.log(`✓ BOT/USD Verified Answer: $${Number(botPrice) / 1e8}`);

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
});
