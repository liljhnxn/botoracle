"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import { formatAddress } from "../../../lib/identity";
import {
  Activity,
  Clock,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Database,
  BarChart3,
} from "lucide-react";

export default function FeedDetailPage() {
  const params = useParams();
  const feedId = params?.id ? BigInt(params.id as string) : 1n;

  // 1. Fetch Feed Details
  const { data: feed, isLoading: feedLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getFeed",
    args: [feedId],
  });

  // 2. Fetch Latest Round Data
  const latestRoundId = feed?.latestRoundId || 0n;
  const { data: latestRound, isLoading: roundLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getRound",
    args: [feedId, latestRoundId],
    query: {
      enabled: latestRoundId > 0n,
    },
  });

  // 3. Fetch Provider Submissions for Latest Round
  const { data: submissionsData, isLoading: submissionsLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getRoundSubmissions",
    args: [feedId, latestRoundId],
    query: {
      enabled: latestRoundId > 0n,
    },
  });

  if (feedLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-mono text-slate-400">Loading feed specifications from Botchain...</p>
      </div>
    );
  }

  if (!feed || feed.createdAt === 0n) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="rounded-xl border border-border bg-surface-100 p-12 max-w-md mx-auto">
          <Database className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-mono font-bold text-white">Feed #{feedId.toString()} Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">This oracle feed has not been initialized on-chain.</p>
          <Link
            href="/feeds"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Feeds</span>
          </Link>
        </div>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const hasAnswer = feed.latestUpdatedAt > 0n;
  const updatedSec = Number(feed.latestUpdatedAt);
  const secondsAgo = hasAnswer ? Math.max(0, now - updatedSec) : null;
  const heartbeatSec = Number(feed.heartbeat);
  const isStale = hasAnswer && secondsAgo !== null ? secondsAgo > heartbeatSec : true;

  const formattedPrice = hasAnswer
    ? parseFloat(formatUnits(feed.latestAnswer, feed.decimals)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    : "Pending Initial Finalization";

  const medianValue = latestRound?.finalAnswer || feed.latestAnswer;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/feeds" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          <span>Feeds</span>
        </Link>
        <span>/</span>
        <span className="text-white">{feed.symbol}</span>
      </div>

      {/* Feed Header Banner */}
      <div className="rounded-2xl border border-border bg-surface-100/90 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
              {feed.symbol}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${
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
              {!feed.active ? "Inactive" : isStale ? "Stale Data (Exceeded Heartbeat)" : "Healthy Feed"}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{feed.name}</p>
        </div>

        {/* Latest Answer Display */}
        <div className="text-left md:text-right">
          <span className="text-xs font-mono uppercase text-slate-400">Aggregated Median Price</span>
          <div className="text-3xl sm:text-4xl font-bold font-mono text-primary mt-0.5">
            {hasAnswer ? `$${formattedPrice}` : formattedPrice}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            Last finalized: {secondsAgo !== null ? `${secondsAgo}s ago` : "Never"}
          </div>
        </div>
      </div>

      {/* Protocol Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Feed ID</div>
          <div className="text-lg font-bold font-mono text-white mt-1">#{feed.id.toString()}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Decimals</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{feed.decimals}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Heartbeat</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{feed.heartbeat.toString()}s</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Min Providers</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{feed.minProviders.toString()}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Deviation Limit</div>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {(Number(feed.deviationThreshold) / 100).toFixed(1)}%
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Latest Round</div>
          <div className="text-lg font-bold font-mono text-white mt-1">#{latestRoundId.toString()}</div>
        </div>
      </div>

      {/* Actual Provider Participation Breakdown */}
      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Provider Submissions & Outlier Detection</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Round #{latestRoundId.toString()} on-chain observations and basis points deviation analysis.
            </p>
          </div>

          {latestRoundId > 0n && (
            <Link
              href={`/round/${feed.id.toString()}/${latestRoundId.toString()}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline self-start sm:self-auto"
            >
              <span>View Round Details</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {submissionsLoading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-400">Loading round observations...</div>
        ) : !submissionsData || submissionsData[0].length === 0 ? (
          <div className="py-12 text-center">
            <Database className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">No submissions recorded for this round yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 border-b border-border/60 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Provider Address</th>
                  <th className="py-3 px-4">Reported Value</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Deviation from Median</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300">
                {submissionsData[0].map((providerAddr, idx) => {
                  const val = submissionsData[1][idx];
                  const timestamp = Number(submissionsData[2][idx]);
                  const formattedVal = parseFloat(formatUnits(val, feed.decimals)).toFixed(4);

                  // Calculate deviation bps
                  let deviationBps = 0;
                  if (medianValue !== 0n) {
                    const absDiff = val >= medianValue ? val - medianValue : medianValue - val;
                    const absMedian = medianValue >= 0n ? medianValue : -medianValue;
                    deviationBps = Number((absDiff * 10000n) / absMedian);
                  }
                  const isOutlier = deviationBps > Number(feed.deviationThreshold);

                  return (
                    <tr key={providerAddr} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <Link
                          href={`/provider/${providerAddr}`}
                          className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{formatAddress(providerAddr)}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">${formattedVal}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {timestamp > 0 ? new Date(timestamp * 1000).toLocaleTimeString() : "--"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={isOutlier ? "text-accent-rose" : "text-slate-400"}>
                          {(deviationBps / 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isOutlier
                              ? "bg-accent-rose/10 text-accent-rose border-accent-rose/30"
                              : "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                          }`}
                        >
                          {isOutlier ? (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              <span>Outlier (Slashed)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Within Range</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Data Section */}
      <div className="rounded-xl border border-border bg-surface-100 p-6">
        <div className="flex items-center gap-2 mb-2 font-mono text-base font-bold text-white">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>Historical Round Telemetry</span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Deterministic time-series feeds recorded immutably on Botchain block storage.
        </p>

        {latestRoundId === 0n ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 border border-dashed border-border rounded-lg">
            No historical rounds available. Waiting for initial round finalization.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-border">
              <div>
                <span className="text-primary font-bold">Round #{latestRoundId.toString()}</span>
                <span className="text-slate-400 ml-2">
                  Finalized Answer: ${formattedPrice}
                </span>
              </div>
              <span className="text-slate-400">
                {latestRound?.finalizedAt ? new Date(Number(latestRound.finalizedAt) * 1000).toLocaleString() : "Active"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
