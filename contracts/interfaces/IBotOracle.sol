// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBotOracle
 * @notice Lightweight interface for consuming BotOracle decentralized data feeds on Botchain Testnet.
 */
interface IBotOracle {
    /**
     * @notice Returns the latest verified answer for a given data feed.
     * @param feedId The unique identifier of the feed.
     * @return answer The latest verified integer value (scaled by feed.decimals).
     * @return updatedAt Timestamp when the feed was last updated.
     * @return roundId Identifier of the round that produced this answer.
     */
    function getLatestAnswer(uint256 feedId)
        external
        view
        returns (
            int256 answer,
            uint256 updatedAt,
            uint256 roundId
        );

    /**
     * @notice Returns detailed round data for the latest round of a given feed.
     * @param feedId The unique identifier of the feed.
     */
    function latestRoundData(uint256 feedId)
        external
        view
        returns (
            uint256 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint256 submissionCount
        );
}
