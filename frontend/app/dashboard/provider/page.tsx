"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../../lib/contracts/botoracle";
import { formatUnits, parseEther } from "viem";
import { formatAddress } from "../../../lib/identity";
import {
  Layers,
  Shield,
  Award,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Power,
  ExternalLink,
  PlusCircle,
  Download,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function ProviderDashboardPage() {
  const { address, isConnected } = useAccount();
  const [increaseAmount, setIncreaseAmount] = useState("1.0");
  const [withdrawAmount, setWithdrawAmount] = useState("0.5");
  const [activeModal, setActiveModal] = useState<"NONE" | "INCREASE" | "WITHDRAW_REQ">("NONE");

  // State for manual price submission
  const [submitFeedId, setSubmitFeedId] = useState("1");
  const [submitRoundId, setSubmitRoundId] = useState("1");
  const [submitPrice, setSubmitPrice] = useState("");

  // Read provider struct
  const { data: provider, refetch: refetchProvider } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getProvider",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "pendingRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read all feeds
  const { data: feeds } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllFeeds",
  });

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Auto-populate active round ID when feeds load or feed selection changes
  React.useEffect(() => {
    if (feeds && feeds.length > 0) {
      const selectedFeed = feeds.find((f) => f.id.toString() === submitFeedId);
      if (selectedFeed && selectedFeed.latestRoundId > 0n) {
        setSubmitRoundId(selectedFeed.latestRoundId.toString());
      }
    }
  }, [feeds, submitFeedId]);

  const isRegistered = provider && provider.registeredAt > 0n;

  const handleIncreaseStake = (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "increaseStake",
      value: parseEther(increaseAmount),
    });
    setActiveModal("NONE");
  };

  const handleRequestWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "requestStakeWithdrawal",
      args: [parseEther(withdrawAmount)],
    });
    setActiveModal("NONE");
  };

  const handleExecuteWithdraw = () => {
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "withdrawStake",
    });
  };

  const handleToggleActive = () => {
    if (!provider) return;
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "setProviderActive",
      args: [!provider.active],
    });
  };

  const handleWithdrawRewards = () => {
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "withdrawRewards",
    });
  };

  const handleSubmitObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitPrice) return;
    const selectedFeed = feeds?.find((f) => f.id.toString() === submitFeedId);
    const decimals = selectedFeed ? selectedFeed.decimals : 8;
    const scaledVal = BigInt(Math.round(parseFloat(submitPrice) * 10 ** decimals));
    writeContract({
      address: BOTORACLE_ADDRESS,
      abi: BOTORACLE_ABI,
      functionName: "submitValue",
      args: [BigInt(submitFeedId), BigInt(submitRoundId), scaledVal],
    });
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-surface-100 p-10 space-y-4">
          <Wallet className="h-12 w-12 text-slate-500 mx-auto" />
          <h2 className="text-xl font-bold font-mono text-white">Connect Provider Wallet</h2>
          <p className="text-xs text-slate-400">
            Please connect the wallet controlling your BotOracle provider node on BOT Chain Mainnet.
          </p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="max-w-md mx-auto rounded-2xl border border-border bg-surface-100 p-10 space-y-4">
          <Cpu className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-bold font-mono text-white">Node Not Registered</h2>
          <p className="text-xs text-slate-400">
            Connected address <span className="font-mono text-white">{formatAddress(address)}</span> is not registered
            as a provider on BotOracle yet.
          </p>
          <Link
            href="/provider/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-background hover:bg-primary-hover transition-all"
          >
            <span>Register & Stake BOT</span>
          </Link>
        </div>
      </div>
    );
  }

  const stakeBot = parseFloat(formatUnits(provider.stake, 18)).toFixed(3);
  const pendingBot = pendingRewards ? parseFloat(formatUnits(pendingRewards, 18)).toFixed(4) : "0.0000";
  const totalEarnedBot = parseFloat(formatUnits(provider.rewardsEarned, 18)).toFixed(4);
  const penaltiesBot = parseFloat(formatUnits(provider.penaltiesPaid, 18)).toFixed(4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
            <Cpu className="h-3.5 w-3.5" />
            <span>Operator Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {provider.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${
                provider.active
                  ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  provider.active ? "bg-accent-emerald animate-pulse" : "bg-slate-500"
                }`}
              />
              {provider.active ? "Actively Reporting" : "Deactivated"}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">{address}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              refetchProvider();
              refetchRewards();
            }}
            className="p-2 rounded-lg bg-surface-50 border border-border text-slate-400 hover:text-white hover:bg-surface-100"
            title="Refresh State"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-mono font-semibold border transition-all ${
              provider.active
                ? "bg-accent-rose/10 text-accent-rose border-accent-rose/30 hover:bg-accent-rose/20"
                : "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30 hover:bg-accent-emerald/20"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{provider.active ? "Pause Node" : "Activate Node"}</span>
          </button>
        </div>
      </div>

      {/* Transaction Notifications */}
      {hash && (
        <div className="rounded-lg bg-surface-100 border border-primary/40 p-4 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-white">
              {isConfirming ? "Broadcasting transaction to Botchain..." : "Transaction confirmed!"}
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

      {/* Primary Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stake Card */}
        <div className="rounded-xl border border-border bg-surface-100 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Collateral Stake</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{stakeBot} BOT</div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setActiveModal("INCREASE")}
              className="flex-1 rounded-md bg-primary/20 border border-primary/40 py-1.5 text-[11px] font-mono font-medium text-primary hover:bg-primary/30 transition-all flex items-center justify-center gap-1"
            >
              <PlusCircle className="h-3 w-3" />
              <span>Increase</span>
            </button>
            <button
              onClick={() => setActiveModal("WITHDRAW_REQ")}
              className="flex-1 rounded-md bg-surface-50 border border-border py-1.5 text-[11px] font-mono font-medium text-slate-300 hover:text-white hover:bg-surface-200 transition-all"
            >
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Pending Rewards</span>
            <Award className="h-4 w-4 text-accent-emerald" />
          </div>
          <div className="text-2xl font-bold font-mono text-accent-emerald">{pendingBot} BOT</div>
          <div className="mt-4">
            <button
              onClick={handleWithdrawRewards}
              disabled={isPending || !pendingRewards || pendingRewards === 0n}
              className="w-full rounded-md bg-accent-emerald/20 border border-accent-emerald/40 py-1.5 text-[11px] font-mono font-medium text-accent-emerald hover:bg-accent-emerald/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Claim Rewards</span>
            </button>
          </div>
        </div>

        {/* Submissions Stats */}
        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Total Submissions</span>
            <Layers className="h-4 w-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{provider.submissions.toString()}</div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            In-range: <span className="text-accent-emerald font-bold">{provider.successfulRounds.toString()}</span>
          </p>
        </div>

        {/* Slashing Penalties */}
        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Penalties Deducted</span>
            <AlertTriangle className="h-4 w-4 text-accent-rose" />
          </div>
          <div className="text-2xl font-bold font-mono text-accent-rose">{penaltiesBot} BOT</div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            Total Earned: <span className="text-white">{totalEarnedBot} BOT</span>
          </p>
        </div>
      </div>

      {/* Active Feeds Status */}
      <div className="rounded-xl border border-border bg-surface-100 p-6">
        <h3 className="text-base font-bold font-mono text-white mb-1">
          Active Protocol Data Feeds
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Feeds requiring periodic telemetry reports from registered providers.
        </p>

        {!feeds || feeds.length === 0 ? (
          <p className="text-xs font-mono text-slate-500">No active feeds available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map((f) => (
              <div
                key={f.id.toString()}
                className="p-4 rounded-lg bg-surface-50 border border-border flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-bold font-mono text-white">{f.symbol}</span>
                  <p className="text-[11px] text-slate-400">Round #{f.latestRoundId.toString()}</p>
                </div>
                <Link
                  href={`/feed/${f.id.toString()}`}
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  <span>Feed</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Price Observation Card */}
      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold font-mono text-white">Submit Price Observation</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Report your price observation for an open round on BOT Chain Mainnet.
          </p>
        </div>

        <form onSubmit={handleSubmitObservation} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end font-mono">
          <div>
            <label className="text-[11px] text-slate-400 uppercase">Target Feed</label>
            <select
              value={submitFeedId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSubmitFeedId(nextId);
                const f = feeds?.find((item) => item.id.toString() === nextId);
                if (f && f.latestRoundId > 0n) {
                  setSubmitRoundId(f.latestRoundId.toString());
                }
              }}
              className="w-full mt-1.5 rounded-lg bg-surface-50 border border-border px-3 py-2 text-white text-xs"
            >
              {feeds && feeds.length > 0 ? (
                feeds.map((f) => (
                  <option key={f.id.toString()} value={f.id.toString()}>
                    #{f.id.toString()} - {f.symbol} ({f.name})
                  </option>
                ))
              ) : (
                <option value="1">#1 - BTC/USD</option>
              )}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 uppercase">Round ID</label>
              {(() => {
                const currentFeed = feeds?.find((item) => item.id.toString() === submitFeedId);
                return currentFeed && currentFeed.latestRoundId > 0n ? (
                  <span className="text-[10px] text-primary font-bold">Active: #{currentFeed.latestRoundId.toString()}</span>
                ) : null;
              })()}
            </div>
            <input
              type="number"
              min="1"
              value={submitRoundId}
              onChange={(e) => setSubmitRoundId(e.target.value)}
              placeholder="e.g. 2"
              className="w-full mt-1.5 rounded-lg bg-surface-50 border border-border px-3 py-2 text-white text-xs"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 uppercase">Observation Price (USD)</label>
            <input
              type="number"
              step="any"
              value={submitPrice}
              onChange={(e) => setSubmitPrice(e.target.value)}
              placeholder="e.g. 112500.00"
              className="w-full mt-1.5 rounded-lg bg-surface-50 border border-border px-3 py-2 text-white text-xs"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending || !submitPrice}
              className="w-full rounded-lg bg-primary py-2 px-4 text-xs font-bold text-background hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-glow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? "Submitting..." : "Submit Observation"}</span>
            </button>
          </div>
        </form>

        {writeError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-accent-rose text-xs font-mono">
            <strong>Submission Rejected:</strong>{" "}
            {writeError.message.includes("Round deadline expired")
              ? "Round #1 has expired! Please enter Round ID 2 (the currently active open round)."
              : writeError.message.includes("Already submitted")
              ? "You have already submitted an observation for this round."
              : writeError.message.slice(0, 180)}
          </div>
        )}
        {isConfirming && (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Confirming observation transaction on BOT Chain Mainnet...</span>
          </div>
        )}
        {isConfirmed && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-accent-emerald text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Price observation submitted successfully for Round #{submitRoundId}!</span>
          </div>
        )}
      </div>

      {/* Modal: Increase Stake */}
      {activeModal === "INCREASE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-100 p-6 space-y-4 font-mono">
            <h3 className="text-base font-bold text-white">Increase Collateral Stake</h3>
            <p className="text-xs text-slate-400 font-sans">
              Deposit additional native BOT to reinforce provider collateral and withstand slashing.
            </p>
            <form onSubmit={handleIncreaseStake} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300">Amount (BOT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={increaseAmount}
                  onChange={(e) => setIncreaseAmount(e.target.value)}
                  className="w-full mt-1 rounded-lg bg-surface-50 border border-border px-3 py-2 text-white text-xs"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("NONE")}
                  className="flex-1 py-2 text-xs rounded-lg bg-surface-50 border border-border text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 text-xs rounded-lg bg-primary font-semibold text-background hover:bg-primary-hover"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Stake Withdrawal */}
      {activeModal === "WITHDRAW_REQ" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-100 p-6 space-y-4 font-mono">
            <h3 className="text-base font-bold text-white">Request Stake Withdrawal</h3>
            <p className="text-xs text-slate-400 font-sans">
              Enforces a timelock delay and verifies you have no active unresolved rounds before releasing funds.
            </p>
            <form onSubmit={handleRequestWithdraw} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300">Amount to Withdraw (BOT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={stakeBot}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full mt-1 rounded-lg bg-surface-50 border border-border px-3 py-2 text-white text-xs"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("NONE")}
                  className="flex-1 py-2 text-xs rounded-lg bg-surface-50 border border-border text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 text-xs rounded-lg bg-accent-amber text-background font-semibold hover:bg-accent-amber/90"
                >
                  Request Unlock
                </button>
              </div>
            </form>
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleExecuteWithdraw}
                className="w-full py-2 text-xs rounded-lg bg-surface-50 border border-border text-slate-300 hover:text-white"
              >
                Execute Previously Requested Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
