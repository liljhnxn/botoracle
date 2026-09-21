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
  const consumerAddress = process.env.NEXT_PUBLIC_CONSUMER_CONTRACT_ADDRESS || "0xE1F9B6bB42B69651B54710B4B0AF746b10fc46D2";
  const oracleAddress = process.env.NEXT_PUBLIC_BOTORACLE_CONTRACT_ADDRESS || "0xf52359a1766F6713bF698584F78BbD6a9D4edd11";

  console.log("==================================================");
  console.log("TESTING ON-CHAIN ORACLE CONSUMER EXAMPLE");
  console.log("==================================================");
  console.log(`Consumer Address: ${consumerAddress}`);
  console.log(`Oracle Address:   ${oracleAddress}`);
  console.log(`Network:          Botchain Testnet (Chain ID 968)`);
  console.log("--------------------------------------------------");

  const consumer = await ethers.getContractAt("OracleConsumerExample", consumerAddress);
  
  const [price, updatedAt] = await consumer.getCurrentPrice(1);
  const maxDataAge = await consumer.maxDataAge();

  console.log(`Feed #1 (BTC/USD) Consumption Result:`);
  console.log(`  Current Price:     $${Number(price) / 1e8} USD`);
  console.log(`  Raw Price Answer:  ${price.toString()}`);
  console.log(`  Last Updated At:   ${new Date(Number(updatedAt) * 1000).toLocaleString()}`);
  console.log(`  Max Data Age:      ${maxDataAge.toString()} seconds (Heartbeat threshold)`);
  console.log("--------------------------------------------------");
  console.log("✓ FRESHNESS VERIFIED: On-chain consumer successfully validated the fresh oracle price!");
  console.log("==================================================");
}

main().catch(console.error);
