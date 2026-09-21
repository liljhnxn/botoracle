"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { BOTORACLE_ABI, BOTORACLE_ADDRESS } from "../../../../lib/contracts/botoracle";
import { formatUnits } from "viem";
import { formatAddress } from "../../../../lib/identity";
import {
  Layers,
  ArrowLeft,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Database,
  ExternalLink,
} from "lucide-react";

export default function RoundDetailPage() {
  const params = useParams();
  const feedId = params?.feedId ? BigInt(params.feedId as string) : 1n;
  const roundId = params?.roundId ? BigInt(params.roundId as string) : 1n;

  // 1. Read Feed
  const { data: feed } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getFeed",
    args: [feedId],
  });

  // 2. Read Round
  const { data: round, isLoading: roundLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getRound",
    args: [feedId, roundId],
  });

  // 3. Read Submissions
  const { data: submissionsData, isLoading: submissionsLoading } = useReadContract({
    address: BOTORACLE_ADDRESS,
    abi: BOTORACLE_ABI,
    functionName: "getRoundSubmissions",
    args: [feedId, roundId],
  });

  if (roundLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-mono text-slate-400">Loading round verification data...</p>
      </div>
    );
  }

  if (!round || round.startedAt === 0n) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="rounded-xl border border-border bg-surface-100 p-12 max-w-md mx-auto">
          <Database className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-mono font-bold text-white">Round Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">
            Round #{roundId.toString()} for Feed #{feedId.toString()} has not been started.
          </p>
          <Link
            href={`/feed/${feedId.toString()}`}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary/20 border border-primary/40 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  const decimals = feed ? feed.decimals : 8;
  const deviationThreshold = feed ? Number(feed.deviationThreshold) : 500;
  const medianValue = round.finalAnswer;
  const finalAnswerFormatted =
    round.finalized && medianValue !== 0n
      ? parseFloat(formatUnits(medianValue, decimals)).toFixed(4)
      : "Pending Finalization";

  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > Number(round.deadline);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/feeds" className="hover:text-primary transition-colors">
          Feeds
        </Link>
        <span>/</span>
        <Link href={`/feed/${feedId.toString()}`} className="hover:text-primary transition-colors">
          {feed?.symbol || `Feed #${feedId.toString()}`}
        </Link>
        <span>/</span>
        <span className="text-white">Round #{roundId.toString()}</span>
      </div>

      {/* Round Header Banner */}
      <div className="rounded-2xl border border-border bg-surface-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              Round #{roundId.toString()} Verification
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border ${
                round.finalized
                  ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30"
                  : isExpired
                  ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30"
                  : "bg-primary/10 text-primary border-primary/30"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  round.finalized
                    ? "bg-accent-emerald"
                    : isExpired
                    ? "bg-accent-amber"
                    : "bg-primary animate-pulse"
                }`}
              />
              {round.finalized ? "Finalized" : isExpired ? "Awaiting Finalization" : "Active Round"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Feed: <span className="text-white">{feed?.name} ({feed?.symbol})</span>
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-xs font-mono uppercase text-slate-400">Final Aggregated Median</span>
          <div className="text-3xl font-bold font-mono text-primary mt-0.5">
            {round.finalized ? `$${finalAnswerFormatted}` : finalAnswerFormatted}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="glass-card rounded-xl p-4">
          <span className="text-slate-400 uppercase text-[10px]">Start Time</span>
          <p className="text-white font-bold mt-1">
            {new Date(Number(round.startedAt) * 1000).toLocaleTimeString()}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <span className="text-slate-400 uppercase text-[10px]">Reporting Deadline</span>
          <p className="text-white font-bold mt-1">
            {new Date(Number(round.deadline) * 1000).toLocaleTimeString()}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <span className="text-slate-400 uppercase text-[10px]">Submission Count</span>
          <p className="text-white font-bold mt-1">
            {round.submissionCount.toString()} / {feed?.minProviders.toString()} required
          </p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <span className="text-slate-400 uppercase text-[10px]">Deviation Threshold</span>
          <p className="text-white font-bold mt-1">{(deviationThreshold / 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border border-border bg-surface-100 p-6 space-y-4">
        <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Independent Provider Observations</span>
        </h2>

        {submissionsLoading ? (
          <div className="py-8 text-center text-xs font-mono text-slate-400">Loading submissions...</div>
        ) : !submissionsData || submissionsData[0].length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-500">
            No submissions recorded for this round.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 border-b border-border/60 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Provider Address</th>
                  <th className="py-3 px-4">Submitted Value</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Deviation from Median</th>
                  <th className="py-3 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-slate-300">
                {submissionsData[0].map((providerAddr, idx) => {
                  const val = submissionsData[1][idx];
                  const timestamp = Number(submissionsData[2][idx]);
                  const formattedVal = parseFloat(formatUnits(val, decimals)).toFixed(4);

                  let deviationBps = 0;
                  if (medianValue !== 0n) {
                    const absDiff = val >= medianValue ? val - medianValue : medianValue - val;
                    const absMedian = medianValue >= 0n ? medianValue : -medianValue;
                    deviationBps = Number((absDiff * 10000n) / absMedian);
                  }
                  const isOutlier = deviationBps > deviationThreshold;

                  return (
                    <tr key={providerAddr} className="hover:bg-surface-50/50">
                      <td className="py-3 px-4 text-white font-medium">
                        <Link href={`/provider/${providerAddr}`} className="hover:text-primary transition-colors">
                          {formatAddress(providerAddr)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">${formattedVal}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {timestamp > 0 ? new Date(timestamp * 1000).toLocaleTimeString() : "--"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={isOutlier ? "text-accent-rose font-bold" : "text-slate-300"}>
                          {(deviationBps / 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
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
                              <span>Outlier</span>
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
    </div>
  );
}
