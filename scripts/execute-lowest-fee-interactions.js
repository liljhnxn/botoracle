const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const RPC_URL = process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const ORACLE_ADDRESS = process.env.BOTORACLE_CONTRACT_ADDRESS || "0x5175b608d7c0e10a4eD0D605d5cA59b1f2E88BBa";

if (!DEPLOYER_KEY) {
  console.error("Error: DEPLOYER_PRIVATE_KEY not found in .env");
  process.exit(1);
}

const BURNER_WALLETS = [
  {
    index: 1,
    address: "0x02394bd55E234CebC07fEe1d84E0AcBe992C16BD",
    privateKey: "0x08e8779263f1eef72e25cd433c80e36464df83c3bfde4051e18ae6bafb1c400a",
    plannedInteractions: 2,
    fundingAmount: ethers.parseEther("0.00205"), // 0.00205 BOT (enough for 2 calls @ 45,431 gas + buffer)
  },
  {
    index: 2,
    address: "0x8De1CC1a9F76A904FE1C426Ac9A10C5927a5ebE2",
    privateKey: "0xd9fde3b66bf12adf3d87f78ac9e6a7aad839f3549bc6b1875389cd6bc1d022aa",
    plannedInteractions: 2,
    fundingAmount: ethers.parseEther("0.00205"), // 0.00205 BOT (enough for 2 calls @ 45,431 gas + buffer)
  },
  {
    index: 3,
    address: "0x0d6A3ad91988d250DF9735B34F002060CE9AD565",
    privateKey: "0x9d518461ffdb7c95a266042a97b20c04be0be22c5ba2f8c751868663080856c9",
    plannedInteractions: 1,
    fundingAmount: ethers.parseEther("0.00105"), // 0.00105 BOT (enough for 1 call @ 45,431 gas + buffer)
  },
];

const ORACLE_ABI = [
  "function fundRewardPool() external payable",
  "function rewardPoolBalance() external view returns (uint256)",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const net = await provider.getNetwork();
  const deployer = new ethers.Wallet(DEPLOYER_KEY, provider);

  console.log("====================================================================");
  console.log(" BotOracle - Ultra-Low Fee 5 Interactions Across 3 Addresses");
  console.log(` Network:          BotChain Mainnet (Chain ID: ${net.chainId})`);
  console.log(` Deployer:         ${deployer.address}`);
  console.log(` Target Contract:  ${ORACLE_ADDRESS}`);
  console.log("====================================================================");

  const initialBalance = await provider.getBalance(deployer.address);
  console.log(`Current Deployer Balance: ${ethers.formatEther(initialBalance)} BOT`);

  const gasPrice = 20000000000n; // 20 Gwei (network minimum floor)
  const transferGasLimit = 21000n;
  const transferFee = transferGasLimit * gasPrice; // 0.00042 BOT

  const totalFunding = BURNER_WALLETS.reduce((sum, w) => sum + w.fundingAmount, 0n);
  const totalFundingFees = transferFee * BigInt(BURNER_WALLETS.length);
  const totalDeployerCost = totalFunding + totalFundingFees;

  console.log(`\n--- Gas & Cost Budgeting ---`);
  console.log(`Minimum Gas Price:       20 Gwei`);
  console.log(`Total Funding Required:  ${ethers.formatEther(totalFunding)} BOT across 3 wallets`);
  console.log(`Estimated Transfer Fees: ${ethers.formatEther(totalFundingFees)} BOT (3 transfers)`);
  console.log(`Total Deployer Cost:     ${ethers.formatEther(totalDeployerCost)} BOT`);
  console.log(`Remaining in Deployer:   ${ethers.formatEther(initialBalance - totalDeployerCost)} BOT`);

  if (initialBalance < totalDeployerCost) {
    throw new Error(`Insufficient funds: need at least ${ethers.formatEther(totalDeployerCost)} BOT`);
  }

  const report = {
    network: "botchainMainnet",
    chainId: Number(net.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    wallets: BURNER_WALLETS.map(w => ({
      index: w.index,
      address: w.address,
      privateKey: w.privateKey,
    })),
    splitFundingTxs: [],
    interactions: [],
  };

  // Step 1: Fund the 3 burner wallets if they don't have enough balance
  console.log("\n[Step 1/2] Funding the 3 Burner Wallets with exact minimal amounts...");
  for (const w of BURNER_WALLETS) {
    const curBal = await provider.getBalance(w.address);
    console.log(`Wallet #${w.index} (${w.address}) current balance: ${ethers.formatEther(curBal)} BOT`);

    if (curBal < w.fundingAmount) {
      const needed = w.fundingAmount - curBal;
      console.log(`  Sending ${ethers.formatEther(needed)} BOT to Wallet #${w.index}...`);
      const tx = await deployer.sendTransaction({
        to: w.address,
        value: needed,
        gasPrice,
        gasLimit: 21000n,
      });
      console.log(`  Tx Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✓ Confirmed in block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed}`);

      report.splitFundingTxs.push({
        walletIndex: w.index,
        recipient: w.address,
        amountBot: ethers.formatEther(needed),
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        feePaidBot: ethers.formatEther(receipt.gasUsed * gasPrice),
        explorerUrl: `https://scan.botchain.ai/tx/${tx.hash}`,
      });
    } else {
      console.log(`  Already funded!`);
    }
  }

  // Step 2: Execute the 5 contract interactions
  console.log("\n[Step 2/2] Executing 5 Contract Interactions using the 3 Addresses...");
  const interactionPlan = [
    { interaction: 1, walletIndex: 1 },
    { interaction: 2, walletIndex: 2 },
    { interaction: 3, walletIndex: 3 },
    { interaction: 4, walletIndex: 1 },
    { interaction: 5, walletIndex: 2 },
  ];

  const valueWei = 1n; // Lowest possible fee: 1 wei

  for (const plan of interactionPlan) {
    const walletConfig = BURNER_WALLETS.find(w => w.index === plan.walletIndex);
    const walletSigner = new ethers.Wallet(walletConfig.privateKey, provider);
    const contract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, walletSigner);

    console.log(`\nExecuting Interaction ${plan.interaction}/5 with Wallet #${walletConfig.index} (${walletConfig.address})...`);
    console.log(`  Calling fundRewardPool() with value = 1 wei...`);

    const tx = await contract.fundRewardPool({
      value: valueWei,
      gasPrice,
      gasLimit: 50000n,
    });
    console.log(`  Tx Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    const feePaid = receipt.gasUsed * gasPrice;
    console.log(`  ✓ Confirmed in block ${receipt.blockNumber}!`);
    console.log(`    Gas Used: ${receipt.gasUsed.toString()} | Fee Paid: ${ethers.formatEther(feePaid)} BOT`);
    console.log(`    Explorer: https://scan.botchain.ai/tx/${tx.hash}`);

    report.interactions.push({
      interaction: plan.interaction,
      walletIndex: walletConfig.index,
      walletAddress: walletConfig.address,
      contract: "BotOracle",
      contractAddress: ORACLE_ADDRESS,
      action: "fundRewardPool(1 wei)",
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      feePaidBot: ethers.formatEther(feePaid),
      explorerUrl: `https://scan.botchain.ai/tx/${tx.hash}`,
    });
  }

  // Save report
  const reportPath = path.join(__dirname, "..", "deployments", "interactions-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\n📄 Interactions report successfully saved to: ${reportPath}`);

  const finalBalance = await provider.getBalance(deployer.address);
  console.log("\n====================================================================");
  console.log(" SUMMARY & REMAINING BALANCES");
  console.log("====================================================================");
  console.log(`Deployer Starting Balance:  ${ethers.formatEther(initialBalance)} BOT`);
  console.log(`Deployer Final Balance:     ${ethers.formatEther(finalBalance)} BOT`);
  console.log(`Net Deployer BOT Consumed:  ${ethers.formatEther(initialBalance - finalBalance)} BOT`);
  console.log(`Funds Preserved for Other:  ${ethers.formatEther(finalBalance)} BOT`);
  console.log("🎉 ALL 5 CONTRACT INTERACTIONS COMPLETED AT MINIMUM POSSIBLE FEE!");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
