import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const currentNetwork = await ethers.provider.getNetwork();
  const chainId = currentNetwork.chainId;
  const isMainnet = chainId === 677n || network.name === "botchain" || network.name === "botchain_mainnet";

  console.log("==================================================");
  console.log(`Deploying BotOracle to network: ${network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Mode: ${isMainnet ? "MAINNET (Low Gas Fee Optimized)" : "LOCAL/DEV"}`);
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account available. Check your private key configuration.");
  }

  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);

  // Target Gas Price: 20 Gwei is the network minimum accepted floor by BOT Chain Mainnet mempool
  const gasPriceGwei = process.env.DEPLOY_GAS_PRICE_GWEI || (isMainnet ? "20" : undefined);
  const txOverrides: { gasPrice?: bigint } = {};
  if (gasPriceGwei) {
    txOverrides.gasPrice = ethers.parseUnits(gasPriceGwei, "gwei");
    console.log(`Target Gas Price: ${gasPriceGwei} Gwei (Lowest network-accepted fee floor)`);
  }

  // 1. Prepare BotOracle deployment
  console.log("\n[1/3] Estimating gas for BotOracle.sol...");
  const BotOracleFactory = await ethers.getContractFactory("BotOracle");
  const deployTx = await BotOracleFactory.getDeployTransaction(deployer.address);
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  const effectiveGasPrice = txOverrides.gasPrice || (await ethers.provider.getFeeData()).gasPrice || 20000000000n;
  const estimatedCost = estimatedGas * effectiveGasPrice;

  console.log(`Estimated Gas Units: ${estimatedGas.toString()}`);
  console.log(`Estimated Deployment Cost: ${ethers.formatEther(estimatedCost)} BOT`);

  if (balance < estimatedCost) {
    console.error("\n❌ INSUFFICIENT BALANCE FOR DEPLOYMENT");
    console.error(`Current balance:   ${ethers.formatEther(balance)} BOT`);
    console.error(`Required gas fee:  ${ethers.formatEther(estimatedCost)} BOT`);
    console.error(`Please fund address: ${deployer.address} with at least ${ethers.formatEther(estimatedCost)} BOT.`);
    process.exitCode = 1;
    return;
  }

  // Deploy BotOracle
  console.log("\n[2/3] Broadcasting BotOracle deployment transaction...");
  const oracle = await BotOracleFactory.deploy(deployer.address, txOverrides);
  console.log(`Tx submitted: ${oracle.deploymentTransaction()?.hash}`);
  console.log("Waiting for confirmation on-chain...");
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  const receipt = await oracle.deploymentTransaction()?.wait();
  const actualGasUsed = receipt?.gasUsed || estimatedGas;
  const actualCost = actualGasUsed * effectiveGasPrice;

  console.log(`✓ BotOracle deployed at: ${oracleAddress}`);
  console.log(`✓ Actual Gas Used: ${actualGasUsed.toString()}`);
  console.log(`✓ Actual Fee Paid: ${ethers.formatEther(actualCost)} BOT`);

  // Deploy OracleConsumerExample only if explicitly requested or on local network
  const deployConsumer = process.env.DEPLOY_CONSUMER_EXAMPLE === "true" || !isMainnet;
  let consumerAddress = "N/A";
  let consumerExplorerUrl = "N/A";

  if (deployConsumer) {
    console.log("\nDeploying OracleConsumerExample.sol...");
    const ConsumerFactory = await ethers.getContractFactory("OracleConsumerExample");
    const maxDataAge = 3600; // 1 hour
    const consumer = await ConsumerFactory.deploy(oracleAddress, maxDataAge, txOverrides);
    await consumer.waitForDeployment();
    consumerAddress = await consumer.getAddress();
    console.log(`✓ OracleConsumerExample deployed at: ${consumerAddress}`);
  } else {
    console.log("\n[Skipping OracleConsumerExample on Mainnet to keep gas fee ~0.04 BOT]");
  }

  // 3. Save Deployment Metadata
  console.log("\n[3/3] Saving deployment metadata...");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const getExplorerUrl = (addr: string) => {
    if (chainId === 677n) return `https://scan.botchain.ai/address/${addr}`;
    return `http://localhost:8545/address/${addr}`;
  };

  const oracleExplorerUrl = getExplorerUrl(oracleAddress);
  if (consumerAddress !== "N/A") {
    consumerExplorerUrl = getExplorerUrl(consumerAddress);
  }

  const deploymentData = {
    network: network.name,
    chainId: chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    gasUsed: actualGasUsed.toString(),
    gasPriceGwei: ethers.formatUnits(effectiveGasPrice, "gwei"),
    feePaidBot: ethers.formatEther(actualCost),
    contracts: {
      BotOracle: {
        address: oracleAddress,
        explorerUrl: oracleExplorerUrl,
      },
      ...(consumerAddress !== "N/A"
        ? {
            OracleConsumerExample: {
              address: consumerAddress,
              explorerUrl: consumerExplorerUrl,
            },
          }
        : {}),
    },
  };

  const metadataPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✓ Deployment metadata saved to: ${metadataPath}`);

  console.log("\n==================================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log(`BotOracle: ${oracleAddress}`);
  if (consumerAddress !== "N/A") {
    console.log(`OracleConsumerExample: ${consumerAddress}`);
  }
  console.log(`BotOracle Explorer: ${oracleExplorerUrl}`);
  console.log(`Total Fee Paid: ${ethers.formatEther(actualCost)} BOT`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
