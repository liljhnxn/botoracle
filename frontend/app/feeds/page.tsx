"use client";

import React from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import { Activity, Clock, ShieldCheck, ArrowRight, AlertCircle, Database } from "lucide-react";

export default function FeedsPage() {
  const { data: feeds, isLoading, error } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getAllFeeds",
  });

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
            <Activity className="h-3.5 w-3.5" />
            <span>Decentralized Data Streams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
            Oracle Data Feeds
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time on-chain data feeds aggregated from independent staked Botchain providers.
          </p>
        </div>

        <Link
          href="/provider/register"
          className="inline-flex items-center gap-2 rounded-lg bg-surface-50 border border-primary/40 px-4 py-2 text-xs font-mono font-medium text-primary hover:bg-primary/10 transition-all self-start sm:self-auto"
        >
          <span>Provide Data</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-12 flex flex-col items-center justify-center p-12 text-center rounded-xl bg-surface-100 border border-border">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-mono text-slate-400">Loading verified feeds from Botchain...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-8 rounded-xl bg-accent-rose/10 border border-accent-rose/30 p-6 text-accent-rose">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold mb-1">
            <AlertCircle className="h-4 w-4" />
            <span>RPC Read Error</span>
          </div>
          <p className="text-xs text-slate-300">
            Could not fetch feed registry. Ensure your wallet or client is pointed to Botchain Testnet (Chain ID 968).
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!feeds || feeds.length === 0) && (
        <div className="mt-12 flex flex-col items-center justify-center p-16 text-center rounded-xl bg-surface-100/60 border border-dashed border-border">
          <Database className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-mono font-semibold text-white">No oracle feeds available.</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            No data feeds have been registered in the contract yet. Feed managers can register initial streams via the Admin dashboard.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary-hover transition-all"
          >
            <span>Go to Admin</span>
          </Link>
        </div>
      )}

      {/* Feeds Grid */}
      {!isLoading && feeds && feeds.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feeds.map((feed) => {
            const hasAnswer = feed.latestUpdatedAt > 0n;
            const updatedSec = Number(feed.latestUpdatedAt);
            const secondsAgo = hasAnswer ? Math.max(0, now - updatedSec) : null;
            const heartbeatSec = Number(feed.heartbeat);
            const isStale = hasAnswer && secondsAgo !== null ? secondsAgo > heartbeatSec : true;

            const formattedPrice = hasAnswer
              ? parseFloat(formatUnits(feed.latestAnswer, feed.decimals)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })
              : "Pending Initial Round";

            return (
              <Link
                key={feed.id.toString()}
                href={`/feed/${feed.id.toString()}`}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-surface-100/80 p-6 transition-all duration-200 hover:border-primary/50 hover:bg-surface-50 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      Feed #{feed.id.toString()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        !feed.active
                          ? "bg-slate-800 text-slate-400 border-slate-700"
                          : isStale
                          ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30"
                          : "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          !feed.active
                            ? "bg-slate-500"
                            : isStale
                            ? "bg-accent-amber"
                            : "bg-accent-emerald animate-pulse"
                        }`}
                      />
                      {!feed.active ? "Inactive" : isStale ? "Stale (Exceeded Heartbeat)" : "Healthy"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-mono text-white group-hover:text-primary transition-colors">
                    {feed.symbol}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{feed.name}</p>

                  {/* Price display */}
                  <div className="mt-5">
                    <div className="text-xs text-slate-400 font-mono uppercase">Verified Answer</div>
                    <div className="text-2xl font-bold font-mono text-white mt-1">
                      {hasAnswer ? `$${formattedPrice}` : formattedPrice}
                    </div>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Last Updated</span>
                    </span>
                    <span className="text-slate-300">
                      {secondsAgo !== null
                        ? secondsAgo < 60
                          ? `${secondsAgo}s ago`
                          : `${Math.floor(secondsAgo / 60)}m ago`
                        : "Never"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Latest Round</span>
                    <span className="text-slate-300">#{feed.latestRoundId.toString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Min Providers</span>
                    <span className="text-slate-300">{feed.minProviders.toString()} required</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Deviation Threshold</span>
                    <span className="text-slate-300">{(Number(feed.deviationThreshold) / 100).toFixed(1)}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
