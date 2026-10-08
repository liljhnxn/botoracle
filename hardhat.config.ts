import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { Agent, setGlobalDispatcher } from "undici";

dotenv.config();

// Ensure undici allows generous connect timeout for RPC
setGlobalDispatcher(
  new Agent({
    connect: { timeout: 60000 },
    headersTimeout: 60000,
    bodyTimeout: 60000,
  })
);

const BOTCHAIN_RPC_URL = process.env.BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    botchain: {
      url: BOTCHAIN_RPC_URL,
      chainId: 677,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 Gwei floor
      timeout: 120000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      botchain: "none",
    },
    customChains: [
      {
        network: "botchain",
        chainId: 677,
        urls: {
          apiURL: "https://scan.botchain.ai/api",
          browserURL: "https://scan.botchain.ai",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
