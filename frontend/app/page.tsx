"use client";

import React from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../lib/contracts/botoracle";
import { formatUnits } from "viem";
import {
  Activity,
  Shield,
  Layers,
  Award,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  // Read real contract state
  const { data: allFeeds, isLoading: feedsLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllFeeds",
  });

  const { data: allProviders, isLoading: providersLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllProviders",
  });

  // Calculate live protocol metrics
  const activeFeedsCount = allFeeds ? allFeeds.filter((f) => f.active).length : 0;
  const activeProvidersCount = allProviders ? allProviders.filter((p) => p.active).length : 0;

  const totalSubmissions = allProviders
    ? allProviders.reduce((acc, p) => acc + Number(p.submissions), 0)
    : 0;

  const totalRewardsDistributed = allProviders
    ? allProviders.reduce((acc, p) => acc + p.rewardsEarned, 0n)
    : 0n;

  return (
    <div className="relative isolate overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/30 to-accent-emerald/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
        <a
          href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 px-4 py-1.5 text-xs font-mono font-medium text-primary mb-6 shadow-glow-sm transition-all group"
          title="View Contract on BOT Chain Mainnet Explorer"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
          <span>Live on BOT Chain Mainnet (Chain ID 677)</span>
          <span className="text-primary/40">•</span>
          <span className="text-slate-300 group-hover:text-white flex items-center gap-1">
            <span>View on Explorer</span>
            <ExternalLink className="h-3 w-3 text-primary" />
          </span>
        </a>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-mono font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          BOT<span className="text-primary">ORACLE</span>
        </h1>

        <p className="mt-4 text-xl sm:text-2xl font-medium text-slate-200 tracking-wide font-sans">
          &ldquo;Trusted data for decentralized applications.&rdquo;
        </p>

        <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
          A decentralized oracle network that brings verified external data on-chain through
          independent providers, transparent aggregation, and economic incentives.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/feeds"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-background shadow-glow hover:bg-primary-hover transition-all"
          >
            <span>Explore Feeds</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/provider/register"
            className="flex items-center gap-2 rounded-lg bg-surface-50 border border-border px-6 py-3 text-sm font-semibold text-white hover:border-primary/50 transition-all hover:bg-surface-100"
          >
            <Cpu className="h-4 w-4 text-primary" />
            <span>Become a Provider</span>
          </Link>
          <a
            href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg bg-surface-50 border border-border px-6 py-3 text-sm font-semibold text-slate-300 hover:border-primary/50 transition-all hover:bg-surface-100 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 text-primary" />
            <span>Mainnet Explorer</span>
          </a>
        </div>

        {/* Real Live Metrics from Blockchain */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-5 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Active Feeds</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {feedsLoading ? <span className="animate-pulse text-slate-600">--</span> : activeFeedsCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Live data streams</p>
          </div>

          <div className="glass-card rounded-xl p-5 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Active Providers</span>
              <Cpu className="h-4 w-4 text-accent-emerald" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {providersLoading ? <span className="animate-pulse text-slate-600">--</span> : activeProvidersCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Independent nodes staked</p>
          </div>

          <div className="glass-card rounded-xl p-5 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Submissions</span>
              <Layers className="h-4 w-4 text-accent-amber" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {providersLoading ? <span className="animate-pulse text-slate-600">--</span> : totalSubmissions}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Recorded on Botchain</p>
          </div>

          <div className="glass-card rounded-xl p-5 text-left">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Rewards Earned</span>
              <Award className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {providersLoading ? (
                <span className="animate-pulse text-slate-600">--</span>
              ) : (
                `${parseFloat(formatUnits(totalRewardsDistributed, 18)).toFixed(3)} BOT`
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Economic distribution</p>
          </div>
        </div>
      </section>

      {/* Oracle Architecture & Security Design */}
      <section className="border-t border-border/80 bg-surface-200/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
              Deterministic Protocol Architecture
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white font-mono">
              Transparent On-Chain Security
            </p>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              BotOracle rejects the false claim that a smart contract can magically &ldquo;know&rdquo; external
              real-world truth. Instead, our protocol establishes verifiable trust through game-theoretic
              economic guarantees and deterministic math.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-border bg-surface-100/90 p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white font-mono">1. Collateral Staking</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Providers lock native BOT as economic collateral before submitting reports. Staked capital
                guarantees skin-in-the-game and acts as economic defense against sybil and spam attacks.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-primary font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Enforced by Smart Contract</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-100/90 p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white font-mono">2. Deterministic Median</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Rather than vulnerable arithmetic means, the protocol computes the exact mathematical
                median of all valid submissions per round. Byzantine outliers cannot skew the consensus price.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-accent-emerald font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Gas-conscious Quick/Insertion Sort</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-100/90 p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-rose/10 text-accent-rose border border-accent-rose/20 mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white font-mono">3. Slashing & Rewards</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Providers within the configured deviation threshold (basis points) receive BOT rewards. Outliers
                deviating beyond the threshold are penalized via automatic on-chain slashing.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-accent-rose font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Configurable bps threshold</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Integration Callout */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-100 via-surface-200 to-surface-100 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              Consume Verified Feeds in One Line
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Integrate the lightweight <span className="font-mono text-primary">IBotOracle</span> interface into your
              DeFi protocols, lending markets, prediction markets, and games on Botchain.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/developer"
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-background hover:bg-primary-hover transition-all"
              >
                <span>Read Integration Guide</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg bg-surface-50 border border-border px-5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-all"
              >
                <span>BotScan Explorer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
