import { ethers } from "hardhat";
import { Agent, setGlobalDispatcher } from "undici";

// Ensure undici allows generous connect timeout for RPC
setGlobalDispatcher(
  new Agent({
    connect: { timeout: 60000 },
    headersTimeout: 60000,
    bodyTimeout: 60000,
  })
);

// 3 Ephemeral Burner Wallets
export const BURNER_WALLETS = [
  {
    address: "0x02394bd55E234CebC07fEe1d84E0AcBe992C16BD",
    privateKey: "0x08e8779263f1eef72e25cd433c80e36464df83c3bfde4051e18ae6bafb1c400a",
  },
  {
    address: "0x8De1CC1a9F76A904FE1C426Ac9A10C5927a5ebE2",
    privateKey: "0xd9fde3b66bf12adf3d87f78ac9e6a7aad839f3549bc6b1875389cd6bc1d022aa",
  },
  {
    address: "0x0d6A3ad91988d250DF9735B34F002060CE9AD565",
    privateKey: "0x9d518461ffdb7c95a266042a97b20c04be0be22c5ba2f8c751868663080856c9",
  },
];

async function main() {
  const provider = ethers.provider;
  const net = await provider.getNetwork();
  const isLocal = net.chainId === 31337n;
  
  let oracleAddress = process.env.BOTORACLE_CONTRACT_ADDRESS || "0x5175b608d7c0e10a4eD0D605d5cA59b1f2E88BBa";
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log("====================================================================");
  console.log(`BotOracle - Split BOT & Execute 5 Contract Interactions`);
  console.log(`Network:            ${isLocal ? "Hardhat Local (Simulation Mode)" : `BotChain (Chain ID: ${net.chainId})`}`);
  console.log("====================================================================");

  if (isLocal) {
    console.log("Deploying fresh BotOracle for simulation...");
    const Factory = await ethers.getContractFactory("BotOracle");
    const oracle = await Factory.deploy(deployer.address);
    await oracle.waitForDeployment();
    oracleAddress = await oracle.getAddress();
    console.log(`BotOracle deployed locally at: ${oracleAddress}`);
  }

  console.log(`Main Wallet:        ${deployer.address}`);
  const mainBalance = await provider.getBalance(deployer.address);
  console.log(`Main Wallet Balance: ${ethers.formatEther(mainBalance)} BOT`);
  console.log(`Target Contract:     ${oracleAddress}`);
  console.log("--------------------------------------------------------------------");

  // BotChain gas economics
  const gasPrice = 20000000000n; // 20 Gwei minimum floor
  const transferGasCost = 21000n * gasPrice; // 0.00042 BOT
  const contractCallGasCost = 50000n * gasPrice; // ~0.00100 BOT

  // Required: 3 distribution transfers + 5 contract calls
  // 3 transfers: 3 * 0.00042 = 0.00126 BOT
  // 5 interactions (split across 3 wallets: wallet 1 does 2, wallet 2 does 2, wallet 3 does 1)
  // Each wallet needs at least 0.0025 BOT for gas + value.
  const recommendedFunding = ethers.parseEther("0.01"); // 0.01 BOT

  console.log("\n[1/3] Burner Wallets Generated:");
  BURNER_WALLETS.forEach((w, i) => {
    console.log(` Wallet #${i + 1}: ${w.address}`);
  });

  if (mainBalance < transferGasCost * 3n) {
    console.log("\n⚠️ INSUFFICIENT BALANCE TO COMPLETE MULTI-WALLET DISTRIBUTION");
    console.log(`Current Balance:   ${ethers.formatEther(mainBalance)} BOT`);
    console.log(`Gas Cost Per Tx:   ${ethers.formatEther(transferGasCost)} BOT (21,000 gas @ 20 Gwei)`);
    console.log(`Needed for 3 Tx:   ${ethers.formatEther(transferGasCost * 3n)} BOT minimum just for transfers`);
    console.log(`Recommended Total: 0.0100 BOT (to cover 3 transfers + 5 contract interactions)`);
    console.log(`\n➡️ Please send ~0.01 BOT to: ${deployer.address}`);
    console.log("Then re-run: npx hardhat run scripts/distribute-and-interact.ts --network botchain");
    return;
  }

  // Calculate split amount per wallet
  let amountPerWallet: bigint;
  if (isLocal) {
    amountPerWallet = ethers.parseEther("10.0"); // 10 BOT per wallet in simulation
  } else {
    // Reserve gas for 3 transfers from main wallet
    const totalReservedGas = transferGasCost * 3n;
    const availableToSend = mainBalance > totalReservedGas ? mainBalance - totalReservedGas : 0n;
    amountPerWallet = availableToSend / 3n;
  }

  console.log(`\n[2/3] Distributing ${ethers.formatEther(amountPerWallet)} BOT to each of the 3 burner wallets...`);

  for (let i = 0; i < BURNER_WALLETS.length; i++) {
    const target = BURNER_WALLETS[i];
    console.log(`Sending ${ethers.formatEther(amountPerWallet)} BOT to Wallet #${i + 1} (${target.address})...`);
    const tx = await deployer.sendTransaction({
      to: target.address,
      value: amountPerWallet,
      gasPrice,
    });
    console.log(`  Tx Hash: ${tx.hash}`);
    await tx.wait();
    console.log(`  Confirmed!`);
  }

  console.log("\n[3/3] Executing 5 Contract Interactions using the 3 Addresses...");
  const oracleAbi = [
    "function fundRewardPool() external payable",
    "function rewardPoolBalance() external view returns (uint256)",
  ];

  const w1 = new ethers.Wallet(BURNER_WALLETS[0].privateKey, provider);
  const w2 = new ethers.Wallet(BURNER_WALLETS[1].privateKey, provider);
  const w3 = new ethers.Wallet(BURNER_WALLETS[2].privateKey, provider);

  const oracleW1 = new ethers.Contract(oracleAddress, oracleAbi, w1);
  const oracleW2 = new ethers.Contract(oracleAddress, oracleAbi, w2);
  const oracleW3 = new ethers.Contract(oracleAddress, oracleAbi, w3);

  // Interaction 1: Wallet 1
  console.log("Interaction 1/5: Wallet 1 calling fundRewardPool()...");
  let tx = await oracleW1.fundRewardPool({ value: 1000n, gasPrice });
  console.log(`  Tx Hash: ${tx.hash}`);
  await tx.wait();
  console.log("  ✓ Interaction 1 confirmed!");

  // Interaction 2: Wallet 2
  console.log("Interaction 2/5: Wallet 2 calling fundRewardPool()...");
  tx = await oracleW2.fundRewardPool({ value: 1000n, gasPrice });
  console.log(`  Tx Hash: ${tx.hash}`);
  await tx.wait();
  console.log("  ✓ Interaction 2 confirmed!");

  // Interaction 3: Wallet 3
  console.log("Interaction 3/5: Wallet 3 calling fundRewardPool()...");
  tx = await oracleW3.fundRewardPool({ value: 1000n, gasPrice });
  console.log(`  Tx Hash: ${tx.hash}`);
  await tx.wait();
  console.log("  ✓ Interaction 3 confirmed!");

  // Interaction 4: Wallet 1
  console.log("Interaction 4/5: Wallet 1 calling fundRewardPool()...");
  tx = await oracleW1.fundRewardPool({ value: 2000n, gasPrice });
  console.log(`  Tx Hash: ${tx.hash}`);
  await tx.wait();
  console.log("  ✓ Interaction 4 confirmed!");

  // Interaction 5: Wallet 2
  console.log("Interaction 5/5: Wallet 2 calling fundRewardPool()...");
  tx = await oracleW2.fundRewardPool({ value: 2000n, gasPrice });
  console.log(`  Tx Hash: ${tx.hash}`);
  await tx.wait();
  console.log("  ✓ Interaction 5 confirmed!");

  console.log("\n🎉 All 5 contract interactions successfully completed on BotChain Mainnet!");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exitCode = 1;
});
