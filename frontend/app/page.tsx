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
  Globe,
  Search,
} from "lucide-react";
import { BotChainLogo } from "../components/BotChainLogo";

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
          <BotChainLogo size={16} />
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
            <BotChainLogo size={18} />
            <span>Mainnet Explorer</span>
            <ExternalLink className="h-3.5 w-3.5 text-primary ml-0.5" />
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

      {/* BOT Chain Ecosystem Section */}
      <section className="border-t border-border/80 bg-surface-200/40 py-20" id="ecosystem">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-surface-100 via-surface-50 to-surface-100 p-8 sm:p-12 shadow-glow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <BotChainLogo size={36} />
                  <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                    Powered By BOT Chain Ecosystem
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-white">
                  Engineered for BOT Chain Infrastructure
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                  BotOracle settles data consensus natively on BOT Chain (Chain ID: 677). Leveraging high-throughput consensus, sub-cent execution fees, and native oracle interfaces, BotOracle empowers autonomous agents and DeFi applications with tamper-resistant on-chain telemetry.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-2 rounded-md bg-surface-200/80 px-3 py-1.5 border border-border">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-white font-semibold">BOT Chain Mainnet</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-surface-200/80 px-3 py-1.5 border border-border">
                    <span className="text-slate-400">Chain ID:</span>
                    <span className="text-primary font-semibold">677</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-surface-200/80 px-3 py-1.5 border border-border">
                    <span className="text-slate-400">Gas Asset:</span>
                    <span className="text-accent-emerald font-semibold">BOT</span>
                  </div>
                </div>
              </div>

              {/* Direct Ecosystem Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full lg:w-80 shrink-0">
                <a
                  href="https://botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-primary/40 bg-surface-200/90 hover:bg-surface-100 p-4 transition-all group shadow-sm hover:border-primary"
                  id="ecosystem-botchain-website"
                >
                  <div className="flex items-center gap-3">
                    <BotChainLogo size={36} />
                    <div>
                      <div className="text-xs font-mono font-bold text-white group-hover:text-primary transition-colors">
                        BOT Chain Website
                      </div>
                      <div className="text-[11px] text-slate-400">botchain.ai</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </a>

                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-primary/40 bg-surface-200/90 hover:bg-surface-100 p-4 transition-all group shadow-sm hover:border-primary"
                  id="ecosystem-botchain-explorer"
                >
                  <div className="flex items-center gap-3">
                    <BotChainLogo size={36} />
                    <div>
                      <div className="text-xs font-mono font-bold text-white group-hover:text-primary transition-colors">
                        BOT Chain Explorer
                      </div>
                      <div className="text-[11px] text-slate-400">scan.botchain.ai</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </a>
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
                <BotChainLogo size={18} />
                <span>BOT Chain Explorer</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
