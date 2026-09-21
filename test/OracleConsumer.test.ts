import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BotOracle, OracleConsumerExample } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OracleConsumerExample Integration Tests", function () {
  let oracle: BotOracle;
  let consumer: OracleConsumerExample;
  let admin: SignerWithAddress;
  let provider1: SignerWithAddress;
  let provider2: SignerWithAddress;
  let provider3: SignerWithAddress;

  const MAX_DATA_AGE = 1800; // 30 minutes heartbeat limit

  beforeEach(async function () {
    [admin, provider1, provider2, provider3] = await ethers.getSigners();

    const BotOracleFactory = await ethers.getContractFactory("BotOracle");
    oracle = await BotOracleFactory.deploy(admin.address);
    await oracle.waitForDeployment();

    const oracleAddress = await oracle.getAddress();
    const ConsumerFactory = await ethers.getContractFactory("OracleConsumerExample");
    consumer = await ConsumerFactory.deploy(oracleAddress, MAX_DATA_AGE);
    await consumer.waitForDeployment();

    // Setup feed and providers
    await oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 1800, 2, 500);

    const stake = ethers.parseEther("1.0");
    await oracle.connect(provider1).registerProvider("Node 1", "", { value: stake });
    await oracle.connect(provider2).registerProvider("Node 2", "", { value: stake });
  });

  it("should read fresh price correctly from BotOracle", async function () {
    // Start round and submit prices
    await oracle.connect(admin).startRound(1);
    await oracle.connect(provider1).submitValue(1, 1, 11245000000000n);
    await oracle.connect(provider2).submitValue(1, 1, 11247000000000n);
    await oracle.connect(admin).finalizeRound(1, 1);

    const [price, updatedAt] = await consumer.getCurrentPrice(1);
    expect(price).to.equal(11246000000000n); // Average of 112450... and 112470...
    expect(updatedAt).to.be.gt(0);
  });

  it("should reject stale price when heartbeat exceeds maxDataAge", async function () {
    await oracle.connect(admin).startRound(1);
    await oracle.connect(provider1).submitValue(1, 1, 11245000000000n);
    await oracle.connect(provider2).submitValue(1, 1, 11247000000000n);
    await oracle.connect(admin).finalizeRound(1, 1);

    // Fast forward time past MAX_DATA_AGE (1800s)
    await time.increase(1801);

    await expect(consumer.getCurrentPrice(1)).to.be.revertedWithCustomError(
      consumer,
      "StaleDataException"
    );
  });

  it("should allow owner to update maxDataAge and oracle address", async function () {
    await expect(consumer.connect(admin).setMaxDataAge(3600))
      .to.emit(consumer, "MaxDataAgeUpdated")
      .withArgs(3600);

    expect(await consumer.maxDataAge()).to.equal(3600);
  });
});
