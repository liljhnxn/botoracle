"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../../lib/contracts/botoracle";
import { parseEther, formatUnits } from "viem";
import {
  Cpu,
  Shield,
  Layers,
  Award,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function RegisterProviderPage() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [stakeAmount, setStakeAmount] = useState("1.0");
  const [errorMsg, setErrorMsg] = useState("");

  // Read Minimum Stake Requirement from Contract
  const { data: minStakeRaw } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "minStake",
  });

  const minStakeFormatted = minStakeRaw ? formatUnits(minStakeRaw, 18) : "1.0";

  // Check if wallet already registered
  const { data: existingProvider } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getProvider",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const isAlreadyRegistered = existingProvider && existingProvider.registeredAt > 0n;

  // Contract write hook
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter a provider name.");
      return;
    }

    const stakeNum = parseFloat(stakeAmount);
    const minStakeNum = parseFloat(minStakeFormatted);
    if (isNaN(stakeNum) || stakeNum < minStakeNum) {
      setErrorMsg(`Stake amount must be at least ${minStakeFormatted} BOT.`);
      return;
    }

    try {
      writeContract({
        address: BOTORACLE_ADDRESS,
        abi: BOTORACLE_ABI,
        functionName: "registerProvider",
        args: [name.trim(), metadataURI.trim()],
        value: parseEther(stakeAmount),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-mono font-medium text-primary mb-3">
          <Cpu className="h-3.5 w-3.5" />
          <span>BotOracle Node Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
          Become a Data Provider
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          Stake BOT collateral, run an independent oracle provider service, submit accurate feed observations,
          and earn automated protocol rewards.
        </p>
      </div>

      {/* 4 Step Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <span className="font-mono text-xs font-bold text-primary">01 / REGISTER</span>
          <h3 className="text-sm font-bold text-white font-mono mt-1">Stake Collateral</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Deposit the minimum required BOT collateral into the protocol escrow contract.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <span className="font-mono text-xs font-bold text-primary">02 / RUN NODE</span>
          <h3 className="text-sm font-bold text-white font-mono mt-1">Run Node Daemon</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Launch the lightweight TypeScript oracle provider daemon with <code className="text-primary font-mono">npm run oracle</code>.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <span className="font-mono text-xs font-bold text-primary">03 / SUBMIT</span>
          <h3 className="text-sm font-bold text-white font-mono mt-1">Submit Values</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your node automatically detects open rounds and submits scaled integer observations.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-100 p-5">
          <span className="font-mono text-xs font-bold text-primary">04 / EARN</span>
          <h3 className="text-sm font-bold text-white font-mono mt-1">Earn BOT Rewards</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Submissions within the deviation threshold accrue native BOT withdrawable anytime.
          </p>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="rounded-2xl border border-border bg-surface-100 p-6 sm:p-10 max-w-2xl mx-auto shadow-lg">
        {!isConnected ? (
          <div className="py-12 text-center space-y-4">
            <Wallet className="h-12 w-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-mono font-bold text-white">Wallet Connection Required</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please connect your Web3 wallet pointing to Botchain Testnet (Chain ID 968) to register as an oracle provider.
            </p>
          </div>
        ) : isAlreadyRegistered ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-accent-emerald/10 border border-accent-emerald/30 text-accent-emerald flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-mono font-bold text-white">Already Registered!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your wallet is already registered as an active oracle provider with {formatUnits(existingProvider.stake, 18)} BOT staked.
            </p>
            <div className="pt-2">
              <a
                href="/dashboard/provider"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-mono font-semibold text-background hover:bg-primary-hover transition-all"
              >
                <span>Go to Provider Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Provider / Node Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Telemetry Node"
                className="w-full rounded-lg bg-surface-50 border border-border px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Human-readable label for on-chain telemetry and ranking.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Metadata URI (Optional)
              </label>
              <input
                type="text"
                value={metadataURI}
                onChange={(e) => setMetadataURI(e.target.value)}
                placeholder="e.g. https://apexnode.io/meta.json or BotNS profile"
                className="w-full rounded-lg bg-surface-50 border border-border px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                External specifications link, website, or identity verification URL.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-medium">
                  Collateral Stake (BOT) <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Minimum: <span className="text-primary font-bold">{minStakeFormatted} BOT</span>
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min={minStakeFormatted}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full rounded-lg bg-surface-50 border border-border px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Locked in the BotOracle contract. Protects protocol against Sybil attacks and bad submissions.
              </p>
            </div>

            {/* Error alerts */}
            {(errorMsg || writeError) && (
              <div className="rounded-lg bg-accent-rose/10 border border-accent-rose/30 p-3 text-accent-rose flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs">{errorMsg || writeError?.message}</span>
              </div>
            )}

            {/* Confirmation status */}
            {isConfirmed && (
              <div className="rounded-lg bg-accent-emerald/10 border border-accent-emerald/30 p-4 text-accent-emerald space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Provider Successfully Registered!</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  You can now configure your private key in <code className="text-white">oracle-node/.env</code> and run the node daemon.
                </p>
                {hash && (
                  <a
                    href={`https://scan.bohr.life/tx/${hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    <span>View Registration Tx</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-background hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow flex items-center justify-center gap-2"
            >
              {(isPending || isConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {isPending
                  ? "Confirm in Wallet..."
                  : isConfirming
                  ? "Awaiting On-Chain Confirmation..."
                  : `Stake ${stakeAmount} BOT & Register`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
