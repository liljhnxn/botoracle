// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBotOracle.sol";

/**
 * @title BotOracle
 * @notice Production-quality decentralized oracle protocol running on BOT Chain Mainnet (Chain ID: 677).
 * @dev External providers stake BOT, report values for registered feeds, and receive rewards.
 * Submissions are deterministically aggregated using median calculations, and outliers outside
 * deviationThresholdBps are penalized according to protocol rules.
 */
contract BotOracle is AccessControl, ReentrancyGuard, IBotOracle {
    // -------------------------------------------------------------------------
    // Roles
    // -------------------------------------------------------------------------
    bytes32 public constant FEED_MANAGER_ROLE = keccak256("FEED_MANAGER_ROLE");
    bytes32 public constant ROUND_MANAGER_ROLE = keccak256("ROUND_MANAGER_ROLE");

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------
    struct Provider {
        address wallet;
        string name;
        string metadataURI;
        uint256 stake;
        bool active;
        uint256 registeredAt;
        uint256 submissions;
        uint256 successfulRounds;
        uint256 rewardsEarned;
        uint256 penaltiesPaid;
    }

    struct StakeWithdrawalRequest {
        uint256 amount;
        uint256 unlockTimestamp;
        bool exists;
    }

    struct Feed {
        uint256 id;
        string name;
        string symbol;
        uint8 decimals;
        uint256 heartbeat;              // Stale time threshold in seconds
        uint256 minProviders;           // Minimum submissions needed to finalize
        uint256 deviationThreshold;     // In basis points (e.g. 500 = 5%)
        bool active;
        uint256 createdAt;
        uint256 latestRoundId;
        int256 latestAnswer;
        uint256 latestUpdatedAt;
    }

    struct Round {
        uint256 id;
        uint256 feedId;
        uint256 startedAt;
        uint256 deadline;
        uint256 submissionCount;
        bool finalized;
        int256 finalAnswer;
        uint256 finalizedAt;
    }

    struct Submission {
        int256 value;
        uint256 submittedAt;
        bool exists;
    }

    // -------------------------------------------------------------------------
    // Protocol Parameters
    // -------------------------------------------------------------------------
    uint256 public minStake = 1 ether;                   // 1 BOT minimum stake
    uint256 public rewardPerRound = 0.01 ether;          // 0.01 BOT per in-range provider per round
    uint256 public slashBps = 500;                       // 5% slash on stake for outliers (500 bps)
    uint256 public defaultRoundDuration = 300;           // 5 minutes deadline per round
    uint256 public stakeWithdrawalDelay = 1 hours;       // Time between withdrawal request & execution
    uint256 public rewardPoolBalance;                    // Escrowed rewards available for payout

    // -------------------------------------------------------------------------
    // State Mappings & Arrays
    // -------------------------------------------------------------------------
    // Feeds: feedId => Feed
    mapping(uint256 => Feed) public feeds;
    uint256[] public feedIds;
    uint256 public nextFeedId = 1;

    // Providers: address => Provider
    mapping(address => Provider) public providers;
    address[] public providerAddresses;
    mapping(address => StakeWithdrawalRequest) public withdrawalRequests;
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public unresolvedRounds; // Count of active rounds provider submitted to

    // Rounds: feedId => roundId => Round
    mapping(uint256 => mapping(uint256 => Round)) public rounds;

    // Submissions: feedId => roundId => providerAddress => Submission
    mapping(uint256 => mapping(uint256 => mapping(address => Submission))) public submissions;
    mapping(uint256 => mapping(uint256 => address[])) public roundProviders;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event ProviderRegistered(address indexed provider, string name, uint256 stake);
    event ProviderUpdated(address indexed provider, string name, string metadataURI);
    event ProviderActivated(address indexed provider);
    event ProviderDeactivated(address indexed provider);
    event StakeDeposited(address indexed provider, uint256 amount, uint256 newTotalStake);
    event StakeWithdrawalRequested(address indexed provider, uint256 amount, uint256 unlockTimestamp);
    event StakeWithdrawn(address indexed provider, uint256 amount, uint256 remainingStake);
    event RewardAccrued(address indexed provider, uint256 indexed feedId, uint256 indexed roundId, uint256 amount);
    event RewardWithdrawn(address indexed provider, uint256 amount);
    event ProviderSlashed(address indexed provider, uint256 indexed feedId, uint256 indexed roundId, uint256 amount);

    event FeedCreated(
        uint256 indexed feedId,
        string name,
        string symbol,
        uint8 decimals,
        uint256 heartbeat,
        uint256 minProviders,
        uint256 deviationThreshold
    );
    event FeedUpdated(
        uint256 indexed feedId,
        uint256 heartbeat,
        uint256 minProviders,
        uint256 deviationThreshold
    );
    event FeedActivated(uint256 indexed feedId);
    event FeedDeactivated(uint256 indexed feedId);

    event RoundStarted(uint256 indexed feedId, uint256 indexed roundId, uint256 startedAt, uint256 deadline);
    event ValueSubmitted(uint256 indexed feedId, uint256 indexed roundId, address indexed provider, int256 value);
    event RoundFinalized(uint256 indexed feedId, uint256 indexed roundId, int256 finalAnswer);

    event ProtocolConfigUpdated(
        uint256 minStake,
        uint256 rewardPerRound,
        uint256 slashBps,
        uint256 defaultRoundDuration,
        uint256 stakeWithdrawalDelay
    );
    event RewardPoolFunded(address indexed funder, uint256 amount);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(address defaultAdmin) {
        require(defaultAdmin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(FEED_MANAGER_ROLE, defaultAdmin);
        _grantRole(ROUND_MANAGER_ROLE, defaultAdmin);
    }

    // -------------------------------------------------------------------------
    // Provider Management
    // -------------------------------------------------------------------------

    /**
     * @notice Register as a new data provider by staking the required minimum BOT.
     * @param name Display identifier for the provider node.
     * @param metadataURI Metadata link or identity URI (e.g. BotNS or IPFS).
     */
    function registerProvider(string calldata name, string calldata metadataURI)
        external
        payable
    {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(providers[msg.sender].registeredAt == 0, "Already registered");
        require(msg.value >= minStake, "Insufficient stake amount");

        providers[msg.sender] = Provider({
            wallet: msg.sender,
            name: name,
            metadataURI: metadataURI,
            stake: msg.value,
            active: true,
            registeredAt: block.timestamp,
            submissions: 0,
            successfulRounds: 0,
            rewardsEarned: 0,
            penaltiesPaid: 0
        });

        providerAddresses.push(msg.sender);

        emit ProviderRegistered(msg.sender, name, msg.value);
        emit StakeDeposited(msg.sender, msg.value, msg.value);
        emit ProviderActivated(msg.sender);
    }

    /**
     * @notice Update provider display name and metadata.
     */
    function updateProviderMetadata(string calldata name, string calldata metadataURI) external {
        require(providers[msg.sender].registeredAt > 0, "Not registered");
        require(bytes(name).length > 0, "Name cannot be empty");

        providers[msg.sender].name = name;
        providers[msg.sender].metadataURI = metadataURI;

        emit ProviderUpdated(msg.sender, name, metadataURI);
    }

    /**
     * @notice Increase collateral stake for an existing provider.
     */
    function increaseStake() external payable {
        require(providers[msg.sender].registeredAt > 0, "Not registered");
        require(msg.value > 0, "Stake increment must be > 0");

        providers[msg.sender].stake += msg.value;

        // If provider was deactivated due to insufficient stake, reactivate if above minStake
        if (!providers[msg.sender].active && providers[msg.sender].stake >= minStake) {
            providers[msg.sender].active = true;
            emit ProviderActivated(msg.sender);
        }

        emit StakeDeposited(msg.sender, msg.value, providers[msg.sender].stake);
    }

    /**
     * @notice Toggle active participation status.
     * @param active Desired status.
     */
    function setProviderActive(bool active) external {
        require(providers[msg.sender].registeredAt > 0, "Not registered");
        if (active) {
            require(providers[msg.sender].stake >= minStake, "Stake below minimum");
            providers[msg.sender].active = true;
            emit ProviderActivated(msg.sender);
        } else {
            providers[msg.sender].active = false;
            emit ProviderDeactivated(msg.sender);
        }
    }

    /**
     * @notice Request withdrawal of staked BOT. Protects protocol accounting by ensuring no active rounds.
     * @param amount Amount of stake to withdraw.
     */
    function requestStakeWithdrawal(uint256 amount) external {
        Provider storage p = providers[msg.sender];
        require(p.registeredAt > 0, "Not registered");
        require(amount > 0 && amount <= p.stake, "Invalid withdrawal amount");
        require(unresolvedRounds[msg.sender] == 0, "Active unresolved rounds exist");

        uint256 unlockTimestamp = block.timestamp + stakeWithdrawalDelay;
        withdrawalRequests[msg.sender] = StakeWithdrawalRequest({
            amount: amount,
            unlockTimestamp: unlockTimestamp,
            exists: true
        });

        // If remaining stake falls below minStake, immediately deactivate provider
        if (p.stake - amount < minStake && p.active) {
            p.active = false;
            emit ProviderDeactivated(msg.sender);
        }

        emit StakeWithdrawalRequested(msg.sender, amount, unlockTimestamp);
    }

    /**
     * @notice Execute an approved stake withdrawal after the timelock has elapsed.
     */
    function withdrawStake() external nonReentrant {
        StakeWithdrawalRequest memory req = withdrawalRequests[msg.sender];
        require(req.exists, "No withdrawal requested");
        require(block.timestamp >= req.unlockTimestamp, "Timelock not expired");
        require(unresolvedRounds[msg.sender] == 0, "Active unresolved rounds exist");

        Provider storage p = providers[msg.sender];
        require(p.stake >= req.amount, "Stake reduced by penalties");

        uint256 amountToTransfer = req.amount;
        p.stake -= amountToTransfer;
        delete withdrawalRequests[msg.sender];

        (bool success, ) = msg.sender.call{value: amountToTransfer}("");
        require(success, "Transfer failed");

        emit StakeWithdrawn(msg.sender, amountToTransfer, p.stake);
    }

    /**
     * @notice Withdraw accumulated round rewards using pull-payment pattern.
     */
    function withdrawRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No pending rewards");
        require(address(this).balance >= amount, "Insufficient contract balance");

        pendingRewards[msg.sender] = 0;
        if (rewardPoolBalance >= amount) {
            rewardPoolBalance -= amount;
        } else {
            rewardPoolBalance = 0;
        }

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Reward transfer failed");

        emit RewardWithdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Feed Management
    // -------------------------------------------------------------------------

    /**
     * @notice Create a new oracle data feed.
     * @param name Descriptive name of the feed (e.g. "Bitcoin / US Dollar").
     * @param symbol Symbol ticker (e.g. "BTC/USD").
     * @param decimals Fixed-point scaling decimals (e.g. 8 for 10^8).
     * @param heartbeat Stale threshold in seconds (e.g. 3600 for 1 hr).
     * @param minProviders Minimum submissions required before round can finalize.
     * @param deviationThreshold Max acceptable deviation from median in basis points (e.g. 500 = 5%).
     */
    function createFeed(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 heartbeat,
        uint256 minProviders,
        uint256 deviationThreshold
    ) external onlyRole(FEED_MANAGER_ROLE) returns (uint256 feedId) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(heartbeat > 0, "Heartbeat must be > 0");
        require(minProviders >= 1, "Min providers must be >= 1");
        require(deviationThreshold > 0 && deviationThreshold <= 10000, "Deviation out of range (1-10000 bps)");

        feedId = nextFeedId++;
        feeds[feedId] = Feed({
            id: feedId,
            name: name,
            symbol: symbol,
            decimals: decimals,
            heartbeat: heartbeat,
            minProviders: minProviders,
            deviationThreshold: deviationThreshold,
            active: true,
            createdAt: block.timestamp,
            latestRoundId: 0,
            latestAnswer: 0,
            latestUpdatedAt: 0
        });

        feedIds.push(feedId);

        emit FeedCreated(feedId, name, symbol, decimals, heartbeat, minProviders, deviationThreshold);
    }

    /**
     * @notice Update configuration parameters of an existing feed.
     */
    function updateFeed(
        uint256 feedId,
        uint256 heartbeat,
        uint256 minProviders,
        uint256 deviationThreshold
    ) external onlyRole(FEED_MANAGER_ROLE) {
        Feed storage feed = feeds[feedId];
        require(feed.createdAt > 0, "Feed does not exist");
        require(heartbeat > 0, "Heartbeat must be > 0");
        require(minProviders >= 1, "Min providers must be >= 1");
        require(deviationThreshold > 0 && deviationThreshold <= 10000, "Deviation out of range");

        feed.heartbeat = heartbeat;
        feed.minProviders = minProviders;
        feed.deviationThreshold = deviationThreshold;

        emit FeedUpdated(feedId, heartbeat, minProviders, deviationThreshold);
    }

    /**
     * @notice Activate or deactivate a data feed.
     */
    function setFeedActive(uint256 feedId, bool active) external onlyRole(FEED_MANAGER_ROLE) {
        Feed storage feed = feeds[feedId];
        require(feed.createdAt > 0, "Feed does not exist");
        feed.active = active;

        if (active) {
            emit FeedActivated(feedId);
        } else {
            emit FeedDeactivated(feedId);
        }
    }

    // -------------------------------------------------------------------------
    // Round Management & Submissions
    // -------------------------------------------------------------------------

    /**
     * @notice Start a new reporting round for a data feed.
     * @param feedId Identifier of the data feed.
     */
    function startRound(uint256 feedId)
        external
        onlyRole(ROUND_MANAGER_ROLE)
        returns (uint256 roundId)
    {
        Feed storage feed = feeds[feedId];
        require(feed.createdAt > 0 && feed.active, "Feed not active or non-existent");

        uint256 currentRoundId = feed.latestRoundId;
        if (currentRoundId > 0) {
            Round memory currentRound = rounds[feedId][currentRoundId];
            require(
                currentRound.finalized || block.timestamp > currentRound.deadline,
                "Active round in progress"
            );
        }

        roundId = currentRoundId + 1;
        uint256 deadline = block.timestamp + defaultRoundDuration;

        rounds[feedId][roundId] = Round({
            id: roundId,
            feedId: feedId,
            startedAt: block.timestamp,
            deadline: deadline,
            submissionCount: 0,
            finalized: false,
            finalAnswer: 0,
            finalizedAt: 0
        });

        // Note: we track latestRoundId upon creation so consumers and providers know current round
        feed.latestRoundId = roundId;

        emit RoundStarted(feedId, roundId, block.timestamp, deadline);
    }

    /**
     * @notice Submit a price observation for an active round.
     * @param feedId Identifier of the feed.
     * @param roundId Identifier of the round.
     * @param value Scaled integer value submitted by provider.
     */
    function submitValue(
        uint256 feedId,
        uint256 roundId,
        int256 value
    ) external {
        Feed memory feed = feeds[feedId];
        require(feed.createdAt > 0 && feed.active, "Feed inactive or non-existent");

        Provider storage p = providers[msg.sender];
        require(p.registeredAt > 0, "Provider not registered");
        require(p.active, "Provider is inactive");
        require(p.stake >= minStake, "Stake below minimum");

        Round storage round = rounds[feedId][roundId];
        require(round.startedAt > 0, "Round does not exist");
        require(!round.finalized, "Round already finalized");
        require(block.timestamp <= round.deadline, "Round deadline expired");

        require(!submissions[feedId][roundId][msg.sender].exists, "Already submitted for this round");

        submissions[feedId][roundId][msg.sender] = Submission({
            value: value,
            submittedAt: block.timestamp,
            exists: true
        });

        roundProviders[feedId][roundId].push(msg.sender);
        round.submissionCount++;
        p.submissions++;
        unresolvedRounds[msg.sender]++;

        emit ValueSubmitted(feedId, roundId, msg.sender, value);
    }

    // -------------------------------------------------------------------------
    // Deterministic Aggregation & Settlement
    // -------------------------------------------------------------------------

    /**
     * @notice Finalize an oracle round, compute the deterministic median, distribute rewards,
     * and slash outlier submissions beyond deviationThreshold.
     * @param feedId Identifier of the feed.
     * @param roundId Identifier of the round to finalize.
     */
    function finalizeRound(uint256 feedId, uint256 roundId) external nonReentrant {
        Feed storage feed = feeds[feedId];
        require(feed.createdAt > 0, "Feed does not exist");

        Round storage round = rounds[feedId][roundId];
        require(round.startedAt > 0, "Round does not exist");
        require(!round.finalized, "Round already finalized");

        // Can finalize if:
        // 1. Caller has ROUND_MANAGER_ROLE, OR
        // 2. Deadline has passed
        if (!hasRole(ROUND_MANAGER_ROLE, msg.sender)) {
            require(block.timestamp > round.deadline, "Deadline not reached");
        }

        require(
            round.submissionCount >= feed.minProviders,
            "Insufficient provider submissions"
        );

        address[] memory submittedProviders = roundProviders[feedId][roundId];
        uint256 count = submittedProviders.length;
        require(count > 0, "No submissions");

        // 1. Collect values
        int256[] memory values = new int256[](count);
        for (uint256 i = 0; i < count; i++) {
            values[i] = submissions[feedId][roundId][submittedProviders[i]].value;
        }

        // 2. Compute deterministic median
        int256 median = _calculateMedian(values);

        // 3. Process rewards and penalties for participating providers
        uint256 threshold = feed.deviationThreshold;

        for (uint256 i = 0; i < count; i++) {
            address providerAddr = submittedProviders[i];
            int256 val = submissions[feedId][roundId][providerAddr].value;

            // Decrement active unresolved round count
            if (unresolvedRounds[providerAddr] > 0) {
                unresolvedRounds[providerAddr]--;
            }

            Provider storage p = providers[providerAddr];

            bool outlier = _isOutlier(val, median, threshold);

            if (!outlier) {
                // Within range: distribute reward
                p.successfulRounds++;
                if (rewardPerRound > 0) {
                    p.rewardsEarned += rewardPerRound;
                    pendingRewards[providerAddr] += rewardPerRound;
                    emit RewardAccrued(providerAddr, feedId, roundId, rewardPerRound);
                }
            } else {
                // Outlier: penalize according to protocol slash rules
                uint256 penalty = (p.stake * slashBps) / 10000;
                if (penalty > p.stake) {
                    penalty = p.stake;
                }

                if (penalty > 0) {
                    p.stake -= penalty;
                    p.penaltiesPaid += penalty;
                    // Penalty funds are added to protocol reward pool
                    rewardPoolBalance += penalty;
                    emit ProviderSlashed(providerAddr, feedId, roundId, penalty);

                    // Deactivate provider if stake drops below minimum
                    if (p.stake < minStake && p.active) {
                        p.active = false;
                        emit ProviderDeactivated(providerAddr);
                    }
                }
            }
        }

        // 4. Update round and feed state
        round.finalized = true;
        round.finalAnswer = median;
        round.finalizedAt = block.timestamp;

        feed.latestAnswer = median;
        feed.latestUpdatedAt = block.timestamp;

        emit RoundFinalized(feedId, roundId, median);
    }

    /**
     * @dev Deterministic median calculation using in-memory insertion sort.
     * Insertion sort is gas-conscious for standard oracle provider counts (N <= 50).
     */
    function _calculateMedian(int256[] memory values) internal pure returns (int256) {
        uint256 n = values.length;
        require(n > 0, "Empty values");

        for (uint256 i = 1; i < n; i++) {
            int256 key = values[i];
            int256 j = int256(i) - 1;
            while (j >= 0 && values[uint256(j)] > key) {
                values[uint256(j + 1)] = values[uint256(j)];
                j--;
            }
            values[uint256(j + 1)] = key;
        }

        if (n % 2 == 1) {
            return values[n / 2];
        } else {
            int256 mid1 = values[n / 2 - 1];
            int256 mid2 = values[n / 2];
            return (mid1 + mid2) / 2;
        }
    }

    /**
     * @dev Checks if a submission is an outlier compared to the median using basis points:
     * absolute(submission - median) * 10000 / absolute(median) > thresholdBps
     */
    function _isOutlier(
        int256 value,
        int256 median,
        uint256 thresholdBps
    ) internal pure returns (bool) {
        if (value == median) return false;

        uint256 absDiff = value > median ? uint256(value - median) : uint256(median - value);
        uint256 absMedian = median >= 0 ? uint256(median) : uint256(-median);

        if (absMedian == 0) {
            return absDiff > 0;
        }

        uint256 deviationBps = (absDiff * 10000) / absMedian;
        return deviationBps > thresholdBps;
    }

    // -------------------------------------------------------------------------
    // Protocol Economics & Admin
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit native BOT to fund provider rewards.
     */
    function fundRewardPool() external payable {
        require(msg.value > 0, "Funding must be > 0");
        rewardPoolBalance += msg.value;
        emit RewardPoolFunded(msg.sender, msg.value);
    }

    /**
     * @notice Configure protocol parameters.
     */
    function configureProtocol(
        uint256 _minStake,
        uint256 _rewardPerRound,
        uint256 _slashBps,
        uint256 _defaultRoundDuration,
        uint256 _stakeWithdrawalDelay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_slashBps <= 10000, "Slash bps cannot exceed 100%");
        require(_defaultRoundDuration >= 30, "Duration must be >= 30s");

        minStake = _minStake;
        rewardPerRound = _rewardPerRound;
        slashBps = _slashBps;
        defaultRoundDuration = _defaultRoundDuration;
        stakeWithdrawalDelay = _stakeWithdrawalDelay;

        emit ProtocolConfigUpdated(
            _minStake,
            _rewardPerRound,
            _slashBps,
            _defaultRoundDuration,
            _stakeWithdrawalDelay
        );
    }

    // -------------------------------------------------------------------------
    // View Functions & IBotOracle Implementation
    // -------------------------------------------------------------------------

    /**
     * @inheritdoc IBotOracle
     */
    function getLatestAnswer(uint256 feedId)
        external
        view
        override
        returns (
            int256 answer,
            uint256 updatedAt,
            uint256 roundId
        )
    {
        Feed memory feed = feeds[feedId];
        require(feed.createdAt > 0, "Feed does not exist");
        return (feed.latestAnswer, feed.latestUpdatedAt, feed.latestRoundId);
    }

    /**
     * @inheritdoc IBotOracle
     */
    function latestRoundData(uint256 feedId)
        external
        view
        override
        returns (
            uint256 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint256 submissionCount
        )
    {
        Feed memory feed = feeds[feedId];
        require(feed.createdAt > 0, "Feed does not exist");
        roundId = feed.latestRoundId;
        Round memory round = rounds[feedId][roundId];
        return (
            roundId,
            feed.latestAnswer,
            round.startedAt,
            feed.latestUpdatedAt,
            round.submissionCount
        );
    }

    function getFeed(uint256 feedId) external view returns (Feed memory) {
        require(feeds[feedId].createdAt > 0, "Feed does not exist");
        return feeds[feedId];
    }

    function getRound(uint256 feedId, uint256 roundId) external view returns (Round memory) {
        return rounds[feedId][roundId];
    }

    function getSubmission(
        uint256 feedId,
        uint256 roundId,
        address provider
    ) external view returns (Submission memory) {
        return submissions[feedId][roundId][provider];
    }

    function getRoundSubmissions(uint256 feedId, uint256 roundId)
        external
        view
        returns (
            address[] memory providersList,
            int256[] memory values,
            uint256[] memory timestamps
        )
    {
        providersList = roundProviders[feedId][roundId];
        uint256 count = providersList.length;
        values = new int256[](count);
        timestamps = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            Submission memory s = submissions[feedId][roundId][providersList[i]];
            values[i] = s.value;
            timestamps[i] = s.submittedAt;
        }
    }

    function getProvider(address wallet) external view returns (Provider memory) {
        require(providers[wallet].registeredAt > 0, "Provider not registered");
        return providers[wallet];
    }

    function getAllFeeds() external view returns (Feed[] memory) {
        uint256 count = feedIds.length;
        Feed[] memory result = new Feed[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = feeds[feedIds[i]];
        }
        return result;
    }

    function getAllProviders() external view returns (Provider[] memory) {
        uint256 count = providerAddresses.length;
        Provider[] memory result = new Provider[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = providers[providerAddresses[i]];
        }
        return result;
    }

    function getFeedCount() external view returns (uint256) {
        return feedIds.length;
    }

    function getProviderCount() external view returns (uint256) {
        return providerAddresses.length;
    }

    // Fallback to receive native BOT for reward funding
    receive() external payable {
        rewardPoolBalance += msg.value;
        emit RewardPoolFunded(msg.sender, msg.value);
    }
}
