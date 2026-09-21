import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log(`Deploying BotOracle to network: ${network.name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account available. Check your private key configuration.");
  }

  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} BOT`);

  // 1. Deploy BotOracle
  console.log("\n[1/3] Deploying BotOracle.sol...");
  const BotOracleFactory = await ethers.getContractFactory("BotOracle");
  const oracle = await BotOracleFactory.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✓ BotOracle deployed at: ${oracleAddress}`);

  // 2. Deploy OracleConsumerExample with 1 hour max data age
  console.log("\n[2/3] Deploying OracleConsumerExample.sol...");
  const ConsumerFactory = await ethers.getContractFactory("OracleConsumerExample");
  const maxDataAge = 3600; // 1 hour
  const consumer = await ConsumerFactory.deploy(oracleAddress, maxDataAge);
  await consumer.waitForDeployment();
  const consumerAddress = await consumer.getAddress();
  console.log(`✓ OracleConsumerExample deployed at: ${consumerAddress}`);

  // 3. Save Deployment Metadata
  console.log("\n[3/3] Saving deployment metadata...");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const explorerUrl =
    chainId === 968n
      ? `https://scan.bohr.life/address/${oracleAddress}`
      : `http://localhost:8545/address/${oracleAddress}`;

  const deploymentData = {
    network: network.name,
    chainId: chainId.toString(),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      BotOracle: {
        address: oracleAddress,
        explorerUrl: explorerUrl,
      },
      OracleConsumerExample: {
        address: consumerAddress,
        explorerUrl:
          chainId === 968n
            ? `https://scan.bohr.life/address/${consumerAddress}`
            : `http://localhost:8545/address/${consumerAddress}`,
      },
    },
  };

  const metadataPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✓ Deployment metadata saved to: ${metadataPath}`);

  console.log("\n==================================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log(`BotOracle: ${oracleAddress}`);
  console.log(`OracleConsumerExample: ${consumerAddress}`);
  console.log(`Explorer Link: ${explorerUrl}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
