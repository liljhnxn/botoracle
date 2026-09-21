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
  const userAddress = "0x40a7CD9467f97461cE23D3FDC520CF8aD286aAC6";
  
  const provider = ethers.provider;
  const balance = await provider.getBalance(userAddress);
  console.log(`User balance: ${ethers.formatEther(balance)} BOT`);

  const oracle = await ethers.getContractAt("BotOracle", contractAddress);
  
  const pending = await oracle.pendingRewards(userAddress);
  console.log(`Pending rewards for user: ${ethers.formatEther(pending)} BOT`);

  const [ans, up, rId] = await oracle.getLatestAnswer(1);
  console.log(`Feed 1 Latest Answer: $${Number(ans) / 1e8} (Round #${rId}, updated at ${new Date(Number(up) * 1000).toLocaleTimeString()})`);

  const p = await oracle.providers(userAddress);
  console.log("Provider status:", {
    registeredAt: p.registeredAt.toString(),
    active: p.active,
    stake: ethers.formatEther(p.stake),
    name: p.name
  });

  const minStake = await oracle.minStake();
  console.log(`Min Stake: ${ethers.formatEther(minStake)} BOT`);

  // Check Round 1
  const r1 = await oracle.rounds(1, 1);
  console.log("Feed 1 Round 1:", {
    startedAt: r1.startedAt.toString(),
    deadline: r1.deadline.toString(),
    finalized: r1.finalized,
    submissionCount: r1.submissionCount.toString(),
    finalAnswer: r1.finalAnswer.toString()
  });

  // Check Round 2
  const r2 = await oracle.rounds(1, 2);
  console.log("Feed 1 Round 2:", {
    startedAt: r2.startedAt.toString(),
    deadline: r2.deadline.toString(),
    finalized: r2.finalized,
    submissionCount: r2.submissionCount.toString(),
    finalAnswer: r2.finalAnswer.toString()
  });

  // Check Feed 1 latest round
  const feed1 = await oracle.feeds(1);
  console.log("Feed 1:", {
    latestRoundId: feed1.latestRoundId.toString(),
    active: feed1.active,
    decimals: feed1.decimals.toString()
  });

  // Check if user already submitted for Round 1
  const sub1 = await oracle.submissions(1, 1, userAddress);
  console.log("User sub for Round 1 exists?", sub1.exists);

  // Check if user already submitted for Round 2
  const sub2 = await oracle.submissions(1, 2, userAddress);
  console.log("User sub for Round 2 exists?", sub2.exists);

  // Try static call submitValue for Round 1
  try {
    const signer = await ethers.getSigner(userAddress);
    await oracle.connect(signer).submitValue.staticCall(1, 1, 11250000000000n);
    console.log("Static call Round 1: SUCCESS");
  } catch (err: any) {
    console.log("Static call Round 1 FAILED with reason:", err.reason || err.message);
  }

  // Try static call submitValue for Round 2
  try {
    const signer = await ethers.getSigner(userAddress);
    await oracle.connect(signer).submitValue.staticCall(1, 2, 11250000000000n);
    console.log("Static call Round 2: SUCCESS");
  } catch (err: any) {
    console.log("Static call Round 2 FAILED with reason:", err.reason || err.message);
  }
}

main().catch(console.error);
