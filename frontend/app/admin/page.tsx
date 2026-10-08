"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../lib/contracts/botoracle";
import { parseEther } from "viem";
import {
  Shield,
  ShieldAlert,
  Layers,
  Activity,
  PlusCircle,
  Play,
  CheckCircle2,
  ExternalLink,
  Settings,
  Coins,
  Loader2,
} from "lucide-react";

export default function AdminPage() {
  const { address, isConnected } = useAccount();

  // Roles constants
  const { data: DEFAULT_ADMIN_ROLE } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "DEFAULT_ADMIN_ROLE",
  });
  const { data: FEED_MANAGER_ROLE } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "FEED_MANAGER_ROLE",
  });
  const { data: ROUND_MANAGER_ROLE } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "ROUND_MANAGER_ROLE",
  });

  // Check roles
  const { data: isAdmin } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "hasRole",
    args: DEFAULT_ADMIN_ROLE && address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
    query: { enabled: !!DEFAULT_ADMIN_ROLE && !!address },
  });

  const { data: isFeedManager } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "hasRole",
    args: FEED_MANAGER_ROLE && address ? [FEED_MANAGER_ROLE, address] : undefined,
    query: { enabled: !!FEED_MANAGER_ROLE && !!address },
  });

  const { data: isRoundManager } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "hasRole",
    args: ROUND_MANAGER_ROLE && address ? [ROUND_MANAGER_ROLE, address] : undefined,
    query: { enabled: !!ROUND_MANAGER_ROLE && !!address },
  });

  // Load Feeds
  const { data: feeds, refetch: refetchFeeds } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllFeeds",
  });

  // Forms State
  const [newFeedName, setNewFeedName] = useState("Bitcoin / USD");
  const [newFeedSymbol, setNewFeedSymbol] = useState("BTC/USD");
  const [newFeedDecimals, setNewFeedDecimals] = useState("8");
  const [newFeedHeartbeat, setNewFeedHeartbeat] = useState("3600");
  const [newFeedMinProviders, setNewFeedMinProviders] = useState("3");
  const [newFeedDeviationBps, setNewFeedDeviationBps] = useState("500");

  const [fundPoolAmount, setFundPoolAmount] = useState("5.0");

  // Contract write hook
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const hasAnyRole = isAdmin || isFeedManager || isRoundManager;

  const handleCreateFeed = (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "createFeed",
      args: [
        newFeedName,
        newFeedSymbol,
        parseInt(newFeedDecimals, 10),
        BigInt(newFeedHeartbeat),
        BigInt(newFeedMinProviders),
        BigInt(newFeedDeviationBps),
      ],
    });
  };

  const handleStartRound = (feedId: bigint) => {
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "startRound",
      args: [feedId],
    });
  };

  const handleFinalizeRound = (feedId: bigint, roundId: bigint) => {
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "finalizeRound",
      args: [feedId, roundId],
    });
  };

  const handleFundPool = (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "configureProtocol",
      args: [parseEther("1.0"), parseEther("0.05"), 500n, 300n, 3600n],
    });
  };

  // Guard: Not Authorized
  if (!isConnected || !hasAnyRole) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="max-w-md mx-auto rounded-2xl border border-accent-rose/30 bg-surface-100 p-10 space-y-4">
          <div className="h-12 w-12 rounded-full bg-accent-rose/10 border border-accent-rose/30 text-accent-rose flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold font-mono text-white">Admin Access Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {isConnected
              ? `Connected wallet ${address} does not hold DEFAULT_ADMIN_ROLE, FEED_MANAGER_ROLE, or ROUND_MANAGER_ROLE on BotOracle.`
              : "Please connect an authorized protocol administrator wallet."}
          </p>
          <div className="p-3 rounded-lg bg-surface-50 border border-border text-[11px] font-mono text-slate-400 text-left">
            <div>Contract: {BOTORACLE_ADDRESS}</div>
            <div className="mt-1">Network: BOT Chain Mainnet (Chain ID 677)</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="border-b border-border/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
          <Shield className="h-3.5 w-3.5" />
          <span>Governance & Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
          Protocol Administration
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isAdmin && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-primary/10 text-primary border border-primary/30">
              DEFAULT_ADMIN_ROLE
            </span>
          )}
          {isFeedManager && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30">
              FEED_MANAGER_ROLE
            </span>
          )}
          {isRoundManager && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-accent-purple/10 text-accent-purple border border-accent-purple/30">
              ROUND_MANAGER_ROLE
            </span>
          )}
        </div>
      </div>

      {/* Transaction Notifications */}
      {hash && (
        <div className="rounded-lg bg-surface-100 border border-primary/40 p-4 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-white">
              {isConfirming ? "Processing transaction on Botchain..." : "Transaction confirmed!"}
            </span>
          </div>
          <a
            href={`https://scan.botchain.ai/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>BotScan</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Grid: Create Feed & Start Rounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Feed Form */}
        <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            <span>Create New Data Feed</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Register arbitrary market data or off-chain streams on BotOracle.
          </p>

          <form onSubmit={handleCreateFeed} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300">Name</label>
                <input
                  type="text"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300">Symbol</label>
                <input
                  type="text"
                  value={newFeedSymbol}
                  onChange={(e) => setNewFeedSymbol(e.target.value)}
                  className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300">Decimals</label>
                <input
                  type="number"
                  value={newFeedDecimals}
                  onChange={(e) => setNewFeedDecimals(e.target.value)}
                  className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300">Heartbeat (s)</label>
                <input
                  type="number"
                  value={newFeedHeartbeat}
                  onChange={(e) => setNewFeedHeartbeat(e.target.value)}
                  className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300">Min Providers</label>
                <input
                  type="number"
                  value={newFeedMinProviders}
                  onChange={(e) => setNewFeedMinProviders(e.target.value)}
                  className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300">Deviation Threshold (Basis Points: 500 = 5%)</label>
              <input
                type="number"
                value={newFeedDeviationBps}
                onChange={(e) => setNewFeedDeviationBps(e.target.value)}
                className="w-full mt-1 rounded bg-surface-50 border border-border p-2 text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg bg-primary font-semibold text-background hover:bg-primary-hover transition-all"
            >
              Create Feed On-Chain
            </button>
          </form>
        </div>

        {/* Round Lifecycle Management */}
        <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Play className="h-4 w-4 text-accent-emerald" />
            <span>Reporting Round Controls</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Initiate and finalize oracle reporting rounds for active registered feeds.
          </p>

          {!feeds || feeds.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 py-6 text-center">No feeds available to manage.</p>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div
                  key={feed.id.toString()}
                  className="p-3.5 rounded-lg bg-surface-50 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{feed.symbol}</span>
                    <span className="text-slate-400 ml-2">Round #{feed.latestRoundId.toString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartRound(feed.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30"
                    >
                      Start Round
                    </button>
                    {feed.latestRoundId > 0n && (
                      <button
                        onClick={() => handleFinalizeRound(feed.id, feed.latestRoundId)}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded bg-accent-emerald/20 border border-accent-emerald/40 text-accent-emerald hover:bg-accent-emerald/30"
                      >
                        Finalize
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
