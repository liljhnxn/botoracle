// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IBotOracle.sol";

/**
 * @title OracleConsumerExample
 * @notice Example contract showing how a decentralized finance dApp or smart contract
 * on Botchain integrates BotOracle feeds with stale data protection.
 */
contract OracleConsumerExample {
    IBotOracle public oracle;
    address public owner;
    uint256 public maxDataAge; // In seconds, e.g. 3600 (1 hour)

    event OracleUpdated(address newOracle);
    event MaxDataAgeUpdated(uint256 newMaxAge);

    error StaleDataException(uint256 updatedAt, uint256 currentTimestamp, uint256 maxAge);
    error Unauthorized();
    error InvalidAnswer();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _oracle, uint256 _maxDataAge) {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = IBotOracle(_oracle);
        owner = msg.sender;
        maxDataAge = _maxDataAge;
    }

    /**
     * @notice Get current verified price from BotOracle with heartbeat staleness enforcement.
     * @param feedId The feed to read (e.g. BTC/USD or ETH/USD).
     * @return price The latest verified signed integer price.
     * @return updatedAt The timestamp of the round finalization.
     */
    function getCurrentPrice(uint256 feedId) external view returns (int256 price, uint256 updatedAt) {
        uint256 roundId;
        (price, updatedAt, roundId) = oracle.getLatestAnswer(feedId);

        if (price <= 0) {
            revert InvalidAnswer();
        }

        // Stale data protection: reject data older than maxDataAge
        if (block.timestamp - updatedAt > maxDataAge) {
            revert StaleDataException(updatedAt, block.timestamp, maxDataAge);
        }

        return (price, updatedAt);
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = IBotOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setMaxDataAge(uint256 _maxDataAge) external onlyOwner {
        require(_maxDataAge > 0, "Max age must be > 0");
        maxDataAge = _maxDataAge;
        emit MaxDataAgeUpdated(_maxDataAge);
    }
}
