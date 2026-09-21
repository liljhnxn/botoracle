export const BOT_ORACLE_ABI = [
  {
    inputs: [],
    name: "getAllFeeds",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "decimals", type: "uint8" },
          { name: "heartbeat", type: "uint256" },
          { name: "minProviders", type: "uint256" },
          { name: "deviationThreshold", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "latestRoundId", type: "uint256" },
          { name: "latestAnswer", type: "int256" },
          { name: "latestUpdatedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "feedId", type: "uint256" },
      { name: "roundId", type: "uint256" },
    ],
    name: "getRound",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "feedId", type: "uint256" },
          { name: "startedAt", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "submissionCount", type: "uint256" },
          { name: "finalized", type: "bool" },
          { name: "finalAnswer", type: "int256" },
          { name: "finalizedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "feedId", type: "uint256" },
      { name: "roundId", type: "uint256" },
      { name: "provider", type: "address" },
    ],
    name: "getSubmission",
    outputs: [
      {
        components: [
          { name: "value", type: "int256" },
          { name: "submittedAt", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "wallet", type: "address" }],
    name: "getProvider",
    outputs: [
      {
        components: [
          { name: "wallet", type: "address" },
          { name: "name", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "stake", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "registeredAt", type: "uint256" },
          { name: "submissions", type: "uint256" },
          { name: "successfulRounds", type: "uint256" },
          { name: "rewardsEarned", type: "uint256" },
          { name: "penaltiesPaid", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "feedId", type: "uint256" },
      { name: "roundId", type: "uint256" },
      { name: "value", type: "int256" },
    ],
    name: "submitValue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "metadataURI", type: "string" },
    ],
    name: "registerProvider",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;
