import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.BOTORACLE_CONTRACT_ADDRESS || "0xf52359a1766F6713bF698584F78BbD6a9D4edd11";
  console.log(`Connecting to BotOracle at: ${contractAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);

  const oracle = await ethers.getContractAt("BotOracle", contractAddress);

  console.log("Updating Feed #1 parameters: minProviders -> 1...");
  const tx = await oracle.updateFeed(1, 3600, 1, 500);
  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log("Feed #1 updated! minProviders is now 1.");
}

main().catch((err) => {
  console.error("Update error:", err);
  process.exitCode = 1;
});
