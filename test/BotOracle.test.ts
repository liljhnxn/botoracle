import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { BotOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BotOracle Comprehensive Test Suite", function () {
  let oracle: BotOracle;
  let admin: SignerWithAddress;
  let provider1: SignerWithAddress;
  let provider2: SignerWithAddress;
  let provider3: SignerWithAddress;
  let provider4: SignerWithAddress;
  let provider5: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const MIN_STAKE = ethers.parseEther("1.0"); // 1 BOT
  const REWARD_PER_ROUND = ethers.parseEther("0.05"); // 0.05 BOT
  const SLASH_BPS = 500; // 5%

  beforeEach(async function () {
    [admin, provider1, provider2, provider3, provider4, provider5, unauthorized] =
      await ethers.getSigners();

    const BotOracleFactory = await ethers.getContractFactory("BotOracle");
    oracle = await BotOracleFactory.deploy(admin.address);
    await oracle.waitForDeployment();

    // Fund reward pool with 10 BOT
    await oracle.connect(admin).fundRewardPool({ value: ethers.parseEther("10.0") });

    // Configure protocol reward parameters
    await oracle.connect(admin).configureProtocol(
      MIN_STAKE,
      REWARD_PER_ROUND,
      SLASH_BPS,
      300, // 5 min round duration
      3600 // 1 hour withdrawal delay
    );
  });

  describe("1. Access Control & Initial State", function () {
    it("should initialize default roles properly", async function () {
      const DEFAULT_ADMIN_ROLE = await oracle.DEFAULT_ADMIN_ROLE();
      const FEED_MANAGER_ROLE = await oracle.FEED_MANAGER_ROLE();
      const ROUND_MANAGER_ROLE = await oracle.ROUND_MANAGER_ROLE();

      expect(await oracle.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await oracle.hasRole(FEED_MANAGER_ROLE, admin.address)).to.be.true;
      expect(await oracle.hasRole(ROUND_MANAGER_ROLE, admin.address)).to.be.true;
      expect(await oracle.hasRole(FEED_MANAGER_ROLE, unauthorized.address)).to.be.false;
    });

    it("should revert if initialized with zero admin address", async function () {
      const BotOracleFactory = await ethers.getContractFactory("BotOracle");
      await expect(BotOracleFactory.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid admin address"
      );
    });
  });

  describe("2. Provider Registration & Staking Lifecycle", function () {
    it("should successfully register a provider with sufficient stake", async function () {
      const tx = await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta-alpha", {
        value: MIN_STAKE,
      });

      await expect(tx)
        .to.emit(oracle, "ProviderRegistered")
        .withArgs(provider1.address, "Node Alpha", MIN_STAKE);

      const p = await oracle.getProvider(provider1.address);
      expect(p.name).to.equal("Node Alpha");
      expect(p.stake).to.equal(MIN_STAKE);
      expect(p.active).to.be.true;
      expect(p.submissions).to.equal(0);
      expect(await oracle.getProviderCount()).to.equal(1);
    });

    it("should reject registration with empty name", async function () {
      await expect(
        oracle.connect(provider1).registerProvider("", "ipfs://meta", { value: MIN_STAKE })
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("should reject registration with insufficient stake", async function () {
      await expect(
        oracle.connect(provider1).registerProvider("Node Underfunded", "ipfs://meta", {
          value: ethers.parseEther("0.5"),
        })
      ).to.be.revertedWith("Insufficient stake amount");
    });

    it("should reject duplicate registration for the same wallet", async function () {
      await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta", {
        value: MIN_STAKE,
      });

      await expect(
        oracle.connect(provider1).registerProvider("Node Alpha Duplicate", "ipfs://meta", {
          value: MIN_STAKE,
        })
      ).to.be.revertedWith("Already registered");
    });

    it("should allow provider to update metadata", async function () {
      await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta-1", {
        value: MIN_STAKE,
      });

      await expect(
        oracle.connect(provider1).updateProviderMetadata("Node Alpha v2", "ipfs://meta-2")
      )
        .to.emit(oracle, "ProviderUpdated")
        .withArgs(provider1.address, "Node Alpha v2", "ipfs://meta-2");

      const p = await oracle.getProvider(provider1.address);
      expect(p.name).to.equal("Node Alpha v2");
    });

    it("should allow provider to increase stake", async function () {
      await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta", {
        value: MIN_STAKE,
      });

      const additional = ethers.parseEther("2.0");
      await expect(oracle.connect(provider1).increaseStake({ value: additional }))
        .to.emit(oracle, "StakeDeposited")
        .withArgs(provider1.address, additional, MIN_STAKE + additional);

      const p = await oracle.getProvider(provider1.address);
      expect(p.stake).to.equal(MIN_STAKE + additional);
    });

    it("should allow provider to deactivate and reactivate", async function () {
      await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta", {
        value: MIN_STAKE,
      });

      await expect(oracle.connect(provider1).setProviderActive(false))
        .to.emit(oracle, "ProviderDeactivated")
        .withArgs(provider1.address);

      let p = await oracle.getProvider(provider1.address);
      expect(p.active).to.be.false;

      await expect(oracle.connect(provider1).setProviderActive(true))
        .to.emit(oracle, "ProviderActivated")
        .withArgs(provider1.address);

      p = await oracle.getProvider(provider1.address);
      expect(p.active).to.be.true;
    });

    it("should handle stake withdrawal request with timelock", async function () {
      await oracle.connect(provider1).registerProvider("Node Alpha", "ipfs://meta", {
        value: ethers.parseEther("5.0"),
      });

      const withdrawAmount = ethers.parseEther("2.0");
      await oracle.connect(provider1).requestStakeWithdrawal(withdrawAmount);

      // Premature withdrawal must revert
      await expect(oracle.connect(provider1).withdrawStake()).to.be.revertedWith(
        "Timelock not expired"
      );

      // Fast forward time past timelock
      await time.increase(3601);

      const balBefore = await ethers.provider.getBalance(provider1.address);
      const tx = await oracle.connect(provider1).withdrawStake();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const balAfter = await ethers.provider.getBalance(provider1.address);
      expect(balAfter).to.equal(balBefore + withdrawAmount - gasCost);

      const p = await oracle.getProvider(provider1.address);
      expect(p.stake).to.equal(ethers.parseEther("3.0"));
    });
  });

  describe("3. Data Feeds Creation & Updates", function () {
    it("should allow FEED_MANAGER to create a valid feed", async function () {
      const tx = await oracle
        .connect(admin)
        .createFeed("Bitcoin / USD", "BTC/USD", 8, 3600, 3, 500);

      await expect(tx)
        .to.emit(oracle, "FeedCreated")
        .withArgs(1, "Bitcoin / USD", "BTC/USD", 8, 3600, 3, 500);

      const feed = await oracle.getFeed(1);
      expect(feed.name).to.equal("Bitcoin / USD");
      expect(feed.symbol).to.equal("BTC/USD");
      expect(feed.decimals).to.equal(8);
      expect(feed.heartbeat).to.equal(3600);
      expect(feed.minProviders).to.equal(3);
      expect(feed.deviationThreshold).to.equal(500);
      expect(feed.active).to.be.true;
      expect(await oracle.getFeedCount()).to.equal(1);
    });

    it("should reject feed creation from unauthorized address", async function () {
      await expect(
        oracle
          .connect(unauthorized)
          .createFeed("Ethereum / USD", "ETH/USD", 8, 3600, 3, 500)
      ).to.be.reverted;
    });

    it("should reject feed with invalid parameters", async function () {
      // Empty name
      await expect(
        oracle.connect(admin).createFeed("", "BTC/USD", 8, 3600, 3, 500)
      ).to.be.revertedWith("Name required");

      // Zero heartbeat
      await expect(
        oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 0, 3, 500)
      ).to.be.revertedWith("Heartbeat must be > 0");

      // Zero min providers
      await expect(
        oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 3600, 0, 500)
      ).to.be.revertedWith("Min providers must be >= 1");

      // Deviation > 10000 bps
      await expect(
        oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 3600, 3, 10001)
      ).to.be.revertedWith("Deviation out of range (1-10000 bps)");
    });

    it("should allow updating feed configuration and toggling active status", async function () {
      await oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 3600, 3, 500);

      await expect(oracle.connect(admin).updateFeed(1, 1800, 4, 300))
        .to.emit(oracle, "FeedUpdated")
        .withArgs(1, 1800, 4, 300);

      let feed = await oracle.getFeed(1);
      expect(feed.heartbeat).to.equal(1800);
      expect(feed.minProviders).to.equal(4);

      await expect(oracle.connect(admin).setFeedActive(1, false))
        .to.emit(oracle, "FeedDeactivated")
        .withArgs(1);

      feed = await oracle.getFeed(1);
      expect(feed.active).to.be.false;
    });
  });

  describe("4. Reporting Rounds & Provider Submissions", function () {
    let feedId: number;

    beforeEach(async function () {
      // Create BTC/USD feed with min 3 providers, 5% deviation threshold
      await oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 3600, 3, 500);
      feedId = 1;

      // Register 5 providers
      for (const [idx, p] of [provider1, provider2, provider3, provider4, provider5].entries()) {
        await oracle.connect(p).registerProvider(`Provider ${idx + 1}`, `ipfs://p${idx + 1}`, {
          value: MIN_STAKE,
        });
      }
    });

    it("should start a round properly by ROUND_MANAGER", async function () {
      const tx = await oracle.connect(admin).startRound(feedId);
      await expect(tx).to.emit(oracle, "RoundStarted");

      const round = await oracle.getRound(feedId, 1);
      expect(round.id).to.equal(1);
      expect(round.feedId).to.equal(feedId);
      expect(round.submissionCount).to.equal(0);
      expect(round.finalized).to.be.false;
    });

    it("should prevent starting a second round while current round is active and not finalized", async function () {
      await oracle.connect(admin).startRound(feedId);

      await expect(oracle.connect(admin).startRound(feedId)).to.be.revertedWith(
        "Active round in progress"
      );
    });

    it("should accept valid submissions and reject duplicates or unauthorized providers", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Provider 1 submits
      const price1 = 11243000000000n; // scaled 112,430.00
      await expect(oracle.connect(provider1).submitValue(feedId, 1, price1))
        .to.emit(oracle, "ValueSubmitted")
        .withArgs(feedId, 1, provider1.address, price1);

      // Duplicate submission from provider 1 must revert
      await expect(oracle.connect(provider1).submitValue(feedId, 1, price1)).to.be.revertedWith(
        "Already submitted for this round"
      );

      // Unregistered provider must revert
      await expect(oracle.connect(unauthorized).submitValue(feedId, 1, price1)).to.be.revertedWith(
        "Provider not registered"
      );

      // Inactive provider must revert
      await oracle.connect(provider2).setProviderActive(false);
      await expect(oracle.connect(provider2).submitValue(feedId, 1, price1)).to.be.revertedWith(
        "Provider is inactive"
      );
    });

    it("should reject submission after round deadline", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Fast forward past 5-minute round deadline
      await time.increase(301);

      await expect(
        oracle.connect(provider1).submitValue(feedId, 1, 11243000000000n)
      ).to.be.revertedWith("Round deadline expired");
    });
  });

  describe("5. Deterministic Aggregation (Median), Outliers & Slashing", function () {
    let feedId: number;

    beforeEach(async function () {
      await oracle.connect(admin).createFeed("BTC/USD", "BTC/USD", 8, 3600, 3, 500); // 500 bps = 5%
      feedId = 1;

      // Register 5 providers
      for (const [idx, p] of [provider1, provider2, provider3, provider4, provider5].entries()) {
        await oracle.connect(p).registerProvider(`Provider ${idx + 1}`, `ipfs://p${idx + 1}`, {
          value: MIN_STAKE,
        });
      }
    });

    it("should calculate odd-number median accurately (5 providers)", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Provider values:
      // P1: 112430
      // P2: 112510
      // P3: 112470
      // P4: 112455
      // P5: 112490
      // Sorted: [112430, 112455, 112470, 112490, 112510]
      // Expected median: 112470
      await oracle.connect(provider1).submitValue(feedId, 1, 112430);
      await oracle.connect(provider2).submitValue(feedId, 1, 112510);
      await oracle.connect(provider3).submitValue(feedId, 1, 112470);
      await oracle.connect(provider4).submitValue(feedId, 1, 112455);
      await oracle.connect(provider5).submitValue(feedId, 1, 112490);

      const tx = await oracle.connect(admin).finalizeRound(feedId, 1);
      await expect(tx).to.emit(oracle, "RoundFinalized").withArgs(feedId, 1, 112470);

      const [latestAnswer, updatedAt, latestRoundId] = await oracle.getLatestAnswer(feedId);
      expect(latestAnswer).to.equal(112470);
      expect(latestRoundId).to.equal(1);
    });

    it("should calculate even-number median as average of two middle values (4 providers)", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Provider values: 100, 102, 104, 108
      // Middle two: 102 and 104 -> average = 103
      await oracle.connect(provider1).submitValue(feedId, 1, 100);
      await oracle.connect(provider2).submitValue(feedId, 1, 102);
      await oracle.connect(provider3).submitValue(feedId, 1, 104);
      await oracle.connect(provider4).submitValue(feedId, 1, 108);

      await oracle.connect(admin).finalizeRound(feedId, 1);
      const [latestAnswer] = await oracle.getLatestAnswer(feedId);
      expect(latestAnswer).to.equal(103);
    });

    it("should prevent finalization if submission count < minProviders", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Only 2 submissions when min is 3
      await oracle.connect(provider1).submitValue(feedId, 1, 100);
      await oracle.connect(provider2).submitValue(feedId, 1, 102);

      await expect(oracle.connect(admin).finalizeRound(feedId, 1)).to.be.revertedWith(
        "Insufficient provider submissions"
      );
    });

    it("should reward in-range providers and slash outlier submissions", async function () {
      await oracle.connect(admin).startRound(feedId);

      // Feed deviation threshold is 5% (500 bps)
      // Normal values around 100,000:
      // P1: 100,000
      // P2: 101,000 (1% deviation -> in range)
      // P3: 100,500 (0.5% deviation -> in range)
      // P4: 150,000 (+50% deviation -> OUTLIER!)
      // Sorted: [100000, 100500, 101000, 150000]
      // Median: (100500 + 101000) / 2 = 100750
      // P4 deviation: |150000 - 100750| * 10000 / 100750 = 4888 bps (48.88% > 5%) -> OUTLIER
      await oracle.connect(provider1).submitValue(feedId, 1, 100000);
      await oracle.connect(provider2).submitValue(feedId, 1, 101000);
      await oracle.connect(provider3).submitValue(feedId, 1, 100500);
      await oracle.connect(provider4).submitValue(feedId, 1, 150000);

      const p4StakeBefore = (await oracle.getProvider(provider4.address)).stake;

      const tx = await oracle.connect(admin).finalizeRound(feedId, 1);

      // In-range providers receive rewards
      await expect(tx)
        .to.emit(oracle, "RewardAccrued")
        .withArgs(provider1.address, feedId, 1, REWARD_PER_ROUND);

      // Outlier is slashed by 5% of stake
      const expectedSlash = (MIN_STAKE * BigInt(SLASH_BPS)) / 10000n;
      await expect(tx)
        .to.emit(oracle, "ProviderSlashed")
        .withArgs(provider4.address, feedId, 1, expectedSlash);

      const p4After = await oracle.getProvider(provider4.address);
      expect(p4After.stake).to.equal(p4StakeBefore - expectedSlash);
      expect(p4After.penaltiesPaid).to.equal(expectedSlash);
      // Because P4 stake fell below MIN_STAKE (1.0 - 0.05 = 0.95 BOT), P4 should be deactivated!
      expect(p4After.active).to.be.false;

      // P1 can pull pending rewards
      expect(await oracle.pendingRewards(provider1.address)).to.equal(REWARD_PER_ROUND);
      const balBefore = await ethers.provider.getBalance(provider1.address);
      const withdrawTx = await oracle.connect(provider1).withdrawRewards();
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(provider1.address);

      expect(balAfter).to.equal(balBefore + REWARD_PER_ROUND - gasUsed);
      expect(await oracle.pendingRewards(provider1.address)).to.equal(0);

      // Double withdrawal must revert
      await expect(oracle.connect(provider1).withdrawRewards()).to.be.revertedWith(
        "No pending rewards"
      );
    });

    it("should prevent double finalization", async function () {
      await oracle.connect(admin).startRound(feedId);
      await oracle.connect(provider1).submitValue(feedId, 1, 100);
      await oracle.connect(provider2).submitValue(feedId, 1, 101);
      await oracle.connect(provider3).submitValue(feedId, 1, 102);

      await oracle.connect(admin).finalizeRound(feedId, 1);
      await expect(oracle.connect(admin).finalizeRound(feedId, 1)).to.be.revertedWith(
        "Round already finalized"
      );
    });
  });
});
