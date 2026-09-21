import { ethers } from "hardhat";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(
  new Agent({
    connect: { timeout: 60000 },
    headersTimeout: 60000,
    bodyTimeout: 60000,
  })
);

async function main() {
  const contractAddress = process.env.BOTORACLE_CONTRACT_ADDRESS || "0xf52359a1766F6713bF698584F78BbD6a9D4edd11";
  console.log(`Connecting to BotOracle at: ${contractAddress}`);

  const [deployer] = await ethers.getSigners();
  const oracle = await ethers.getContractAt("BotOracle", contractAddress);

  // 1. Extend defaultRoundDuration to 24 hours (86400 seconds)
  console.log("Extending round duration to 24 hours...");
  const configTx = await oracle.configureProtocol(
    ethers.parseEther("0.1"),  // minStake: 0.1 BOT
    ethers.parseEther("0.01"), // rewardPerRound: 0.01 BOT
    500,                       // slashBps: 5%
    86400,                     // defaultRoundDuration: 24 hours
    3600                       // stakeWithdrawalDelay: 1 hour
  );
  await configTx.wait();
  console.log("Protocol configured with 24-hour round duration and 0.1 BOT min stake.");

  // 2. Start Round 2 for Feed 1
  console.log("Starting fresh Round #2 for Feed #1...");
  const startTx = await oracle.startRound(1);
  await startTx.wait();
  console.log("Round #2 is now OPEN and active for 24 hours!");
}

main().catch((err) => {
  console.error("Preparation error:", err);
  process.exitCode = 1;
});
