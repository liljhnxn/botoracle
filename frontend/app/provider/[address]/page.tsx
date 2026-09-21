"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import { formatAddress } from "../../../lib/identity";
import {
  Users,
  Shield,
  Clock,
  Award,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";

export default function ProviderProfilePage() {
  const params = useParams();
  const address = (params?.address as string) || "";

  const { data: provider, isLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getProvider",
    args: [address as `0x${string}`],
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-mono text-slate-400">Loading provider records from Botchain...</p>
      </div>
    );
  }

  if (!provider || provider.registeredAt === 0n) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="rounded-xl border border-border bg-surface-100 p-12 max-w-md mx-auto">
          <Users className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-mono font-bold text-white">Provider Not Registered</h2>
          <p className="text-xs text-slate-400 mt-1">
            The address <span className="font-mono text-white">{formatAddress(address)}</span> is not a registered
            oracle provider on BotOracle.
          </p>
          <Link
            href="/providers"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Providers</span>
          </Link>
        </div>
      </div>
    );
  }

  const stakeBot = parseFloat(formatUnits(provider.stake, 18)).toFixed(2);
  const rewardsBot = parseFloat(formatUnits(provider.rewardsEarned, 18)).toFixed(4);
  const penaltiesBot = parseFloat(formatUnits(provider.penaltiesPaid, 18)).toFixed(4);

  const submissions = Number(provider.submissions);
  const successfulRounds = Number(provider.successfulRounds);
  const factualSuccessRate =
    submissions > 0 ? ((successfulRounds / submissions) * 100).toFixed(1) : "0.0";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/providers" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          <span>Providers</span>
        </Link>
        <span>/</span>
        <span className="text-white">{formatAddress(address)}</span>
      </div>

      {/* Provider Hero */}
      <div className="rounded-2xl border border-border bg-surface-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white">
              {provider.name || "Anonymous Node"}
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
              {provider.active ? "Active Node" : "Inactive Node"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-slate-400">
            <span className="text-white">{address}</span>
            <a
              href={`https://scan.bohr.life/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <span>View in BohrScan</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {provider.metadataURI && (
            <p className="text-xs text-slate-400 mt-2 font-mono break-all">
              Metadata URI: <span className="text-slate-300">{provider.metadataURI}</span>
            </p>
          )}
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs font-mono uppercase text-slate-400">Current Collateral Stake</span>
          <div className="text-3xl font-bold font-mono text-white mt-0.5">{stakeBot} BOT</div>
          <p className="text-xs text-slate-400 mt-1">Locked in escrow</p>
        </div>
      </div>

      {/* Factual Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Total Submissions</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{submissions}</div>
          <p className="text-[11px] text-slate-400 mt-1">Rounds participated</p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Within Deviation Range</span>
            <CheckCircle2 className="h-4 w-4 text-accent-emerald" />
          </div>
          <div className="text-2xl font-bold font-mono text-accent-emerald">{successfulRounds}</div>
          <p className="text-[11px] text-slate-400 mt-1">Accepted submissions</p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Factual In-Range Rate</span>
            <Award className="h-4 w-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{factualSuccessRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Statistical agreement rate</p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Rewards Earned</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{rewardsBot} BOT</div>
          <p className="text-[11px] text-slate-400 mt-1">Accrued from round rewards</p>
        </div>
      </div>

      {/* Penalties and Slashing History */}
      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-3">
        <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-accent-rose" />
          <span>Protocol Penalties & Slashing Accounting</span>
        </h2>
        <p className="text-xs text-slate-400">
          Under protocol rules, values submitted outside the feed deviation threshold trigger automatic
          collateral deductions.
        </p>

        <div className="mt-4 p-4 rounded-lg bg-surface-50 border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono text-xs">
          <div>
            <span className="text-slate-400">Cumulative Penalties Deducted:</span>
            <span className="text-accent-rose font-bold ml-2">{penaltiesBot} BOT</span>
          </div>
          <div className="text-slate-400">
            Registered on-chain:{" "}
            <span className="text-slate-200">
              {new Date(Number(provider.registeredAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
