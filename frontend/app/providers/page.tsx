"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import { formatAddress } from "../../lib/identity";
import { Users, Shield, Cpu, ArrowRight, ExternalLink, Filter, CheckCircle, XCircle } from "lucide-react";

export default function ProvidersPage() {
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const { data: providers, isLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllProviders",
  });

  const filteredProviders = providers
    ? providers.filter((p) => {
        if (filter === "ACTIVE") return p.active;
        if (filter === "INACTIVE") return !p.active;
        return true;
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
            <Users className="h-3.5 w-3.5" />
            <span>Decentralized Node Operators</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
            Oracle Providers Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independent telemetry providers staking BOT collateral to feed on-chain data streams.
          </p>
        </div>

        <Link
          href="/provider/register"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-mono font-semibold text-background hover:bg-primary-hover transition-all self-start sm:self-auto shadow-glow-sm"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>Register Node</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
        <button
          onClick={() => setFilter("ALL")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
            filter === "ALL"
              ? "bg-primary/20 text-primary border border-primary/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All ({providers ? providers.length : 0})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
            filter === "ACTIVE"
              ? "bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Active ({providers ? providers.filter((p) => p.active).length : 0})
        </button>
        <button
          onClick={() => setFilter("INACTIVE")}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
            filter === "INACTIVE"
              ? "bg-accent-rose/20 text-accent-rose border border-accent-rose/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Inactive ({providers ? providers.filter((p) => !p.active).length : 0})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center rounded-xl bg-surface-100 border border-border">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm font-mono text-slate-400">Loading registered providers from Botchain...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProviders.length === 0 && (
        <div className="py-16 text-center rounded-xl bg-surface-100/60 border border-dashed border-border">
          <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-mono font-semibold text-white">No oracle providers found.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === "ALL"
              ? "No nodes have registered on BotOracle yet. Be the first to stake BOT and earn round rewards."
              : `No providers currently match the ${filter.toLowerCase()} filter.`}
          </p>
          <Link
            href="/provider/register"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/30"
          >
            <span>Become a Provider</span>
          </Link>
        </div>
      )}

      {/* Providers Table */}
      {!isLoading && filteredProviders.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 border-b border-border/60 uppercase text-[10px] bg-surface-50/50">
                <tr>
                  <th className="py-3.5 px-4">Provider / Node</th>
                  <th className="py-3.5 px-4">Wallet Address</th>
                  <th className="py-3.5 px-4">Collateral Stake</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Submissions</th>
                  <th className="py-3.5 px-4 text-center">In-Range Rounds</th>
                  <th className="py-3.5 px-4">Total Rewards</th>
                  <th className="py-3.5 px-4">Penalties Paid</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300">
                {filteredProviders.map((p) => {
                  const stakeBot = parseFloat(formatUnits(p.stake, 18)).toFixed(2);
                  const rewardsBot = parseFloat(formatUnits(p.rewardsEarned, 18)).toFixed(3);
                  const penaltiesBot = parseFloat(formatUnits(p.penaltiesPaid, 18)).toFixed(3);

                  return (
                    <tr key={p.wallet} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/provider/${p.wallet}`}
                          className="font-semibold text-white hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{p.name || "Anonymous Node"}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <a
                          href={`https://scan.botchain.ai/address/${p.wallet}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-white inline-flex items-center gap-1"
                        >
                          <span>{formatAddress(p.wallet)}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">{stakeBot} BOT</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            p.active
                              ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {p.active ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-white">
                        {p.submissions.toString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-accent-emerald">
                        {p.successfulRounds.toString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-primary">{rewardsBot} BOT</td>
                      <td className="py-3.5 px-4 text-accent-rose">{penaltiesBot} BOT</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/provider/${p.wallet}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <span>Profile</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
