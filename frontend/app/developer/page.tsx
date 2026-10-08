"use client";

import React, { useState } from "react";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function DeveloperPage() {
  const [copiedSolidity, setCopiedSolidity] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<number>(1);

  // Read latest answer for interactive demo
  const { data: latestAnswerData, isLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getLatestAnswer",
    args: [BigInt(selectedFeedId)],
  });

  const { data: feed } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getFeed",
    args: [BigInt(selectedFeedId)],
  });

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBotOracle {
    function getLatestAnswer(uint256 feedId)
        external
        view
        returns (int256 answer, uint256 updatedAt, uint256 roundId);
}

contract MyDappContract {
    IBotOracle public immutable oracle;
    uint256 public constant MAX_STALENESS = 3600; // 1 hour heartbeat limit

    error StaleOraclePrice(uint256 updatedAt, uint256 maxAge);

    constructor(address _oracle) {
        oracle = IBotOracle(_oracle);
    }

    function readPrice(uint256 feedId) external view returns (int256 price) {
        (int256 answer, uint256 updatedAt, uint256 roundId) = oracle.getLatestAnswer(feedId);

        // Enforce staleness protection
        if (block.timestamp - updatedAt > MAX_STALENESS) {
            revert StaleOraclePrice(updatedAt, MAX_STALENESS);
        }

        return answer;
    }
}`;

  const sdkCode = `import { getBotOraclePrice } from "@botoracle/sdk";

async function main() {
  const priceData = await getBotOraclePrice(1, "${BOTORACLE_ADDRESS}");

  console.log(\`Feed: \${priceData.symbol}\`);
  console.log(\`Price: $\${priceData.formattedPrice}\`);
  console.log(\`Round ID: #\${priceData.roundId}\`);
  console.log(\`Is Stale: \${priceData.isStale}\`);
}

main();`;

  const copyToClipboard = (text: string, type: "solidity" | "sdk") => {
    navigator.clipboard.writeText(text);
    if (type === "solidity") {
      setCopiedSolidity(true);
      setTimeout(() => setCopiedSolidity(false), 2000);
    } else {
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    }
  };

  const now = Math.floor(Date.now() / 1000);
  const answer = latestAnswerData ? latestAnswerData[0] : 0n;
  const updatedAt = latestAnswerData ? Number(latestAnswerData[1]) : 0;
  const roundId = latestAnswerData ? latestAnswerData[2].toString() : "0";
  const decimals = feed ? feed.decimals : 8;
  const isStale = feed && updatedAt > 0 ? now - updatedAt > Number(feed.heartbeat) : true;
  const formattedPrice =
    updatedAt > 0
      ? parseFloat(formatUnits(answer, decimals)).toFixed(4)
      : "No verified answer yet";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="border-b border-border/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
          <Terminal className="h-3.5 w-3.5" />
          <span>Developer Integration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
          Consume BotOracle Feeds
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Integrate verified data streams into your smart contracts and off-chain applications on BOT Chain Mainnet.
        </p>
      </div>

      {/* Mainnet Contract & Explorer Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 font-mono">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-xs font-semibold text-white">BOT Chain Mainnet (Chain ID: 677)</span>
          </div>
          <div className="text-xs text-slate-300 break-all">
            Contract: <span className="text-primary font-bold">{BOTORACLE_ADDRESS}</span>
          </div>
        </div>
        <a
          href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg bg-surface-50 border border-primary/30 hover:border-primary px-3.5 py-2 text-xs text-white hover:bg-surface-100 transition-all shadow-glow-sm"
        >
          <span>View on Mainnet Explorer</span>
          <ExternalLink className="h-3.5 w-3.5 text-primary" />
        </a>
      </div>

      {/* Interactive Consumer Playground */}
      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span>Interactive On-Chain Price Reader</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Live Botchain RPC</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Feed ID</label>
            <select
              value={selectedFeedId}
              onChange={(e) => setSelectedFeedId(parseInt(e.target.value, 10))}
              className="w-full rounded bg-surface-50 border border-border p-2 text-white"
            >
              <option value={1}>Feed #1 (BTC/USD)</option>
              <option value={2}>Feed #2 (ETH/USD)</option>
              <option value={3}>Feed #3 (BOT/USD)</option>
            </select>
          </div>

          <div className="glass-card rounded p-3">
            <span className="text-slate-400 text-[10px] uppercase">Current Answer</span>
            <div className="text-white font-bold text-sm mt-0.5">
              {isLoading ? "Reading..." : updatedAt > 0 ? `$${formattedPrice}` : formattedPrice}
            </div>
          </div>

          <div className="glass-card rounded p-3">
            <span className="text-slate-400 text-[10px] uppercase">Latest Round</span>
            <div className="text-white font-bold text-sm mt-0.5">#{roundId}</div>
          </div>

          <div className="glass-card rounded p-3">
            <span className="text-slate-400 text-[10px] uppercase">Freshness Status</span>
            <div
              className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${
                isStale ? "text-accent-amber" : "text-accent-emerald"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isStale ? "Stale Data" : "Fresh (< Heartbeat)"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Solidity Integration Snippet */}
      <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-50 px-4 py-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-amber/80" />
            <span>MyDappContract.sol</span>
          </div>
          <button
            onClick={() => copyToClipboard(solidityCode, "solidity")}
            className="flex items-center gap-1 rounded bg-surface-200 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-surface-50 transition-colors"
          >
            {copiedSolidity ? (
              <>
                <Check className="h-3 w-3 text-accent-emerald" />
                <span className="text-[11px] text-accent-emerald">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[11px]">Copy Solidity</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-[#0b0d13]">
          <code>{solidityCode}</code>
        </pre>
      </div>

      {/* TypeScript SDK Snippet */}
      <div className="rounded-xl border border-border bg-surface-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-50 px-4 py-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            <span>index.ts (TypeScript / Node.js)</span>
          </div>
          <button
            onClick={() => copyToClipboard(sdkCode, "sdk")}
            className="flex items-center gap-1 rounded bg-surface-200 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-surface-50 transition-colors"
          >
            {copiedSdk ? (
              <>
                <Check className="h-3 w-3 text-accent-emerald" />
                <span className="text-[11px] text-accent-emerald">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[11px]">Copy SDK Snippet</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-[#0b0d13]">
          <code>{sdkCode}</code>
        </pre>
      </div>
    </div>
  );
}
