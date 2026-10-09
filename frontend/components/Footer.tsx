import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Terminal, Layers, Cpu } from "lucide-react";
import { BotChainLogo } from "./BotChainLogo";
import { BOTORACLE_ADDRESS } from "../lib/contracts/botoracle";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-surface-200/95 pt-12 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* BOT Chain Ecosystem Feature Banner */}
        <div className="mb-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <BotChainLogo size={48} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-white tracking-wide">
                    BOT <span className="text-primary">CHAIN</span>
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary font-medium">
                    Mainnet (Chain ID 677)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  BotOracle settles data consensus natively on BOT Chain &mdash; the high-performance blockchain designed for autonomous AI agents and verifiable data feeds.
                </p>
              </div>
            </div>

            {/* Required Links Callout Buttons with Official Logo at the Front */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-border hover:border-primary/50 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-sm group"
                id="footer-botchain-website"
              >
                <BotChainLogo size={20} />
                <span>BOT Chain Website</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors ml-1" />
              </a>

              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-primary/40 hover:border-primary px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-glow-sm group"
                id="footer-botchain-explorer"
              >
                <BotChainLogo size={20} />
                <span>BOT Chain Explorer</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-mono text-base font-bold text-white tracking-wider">
                BOT<span className="text-primary">ORACLE</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              &ldquo;Trusted data for decentralized applications.&rdquo;
            </p>
            <div className="rounded-lg bg-surface-100/80 border border-border p-3 text-[11px] leading-relaxed text-slate-400">
              <span className="font-semibold text-primary flex items-center gap-1 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Oracle Security Principles
              </span>
              Deterministic on-chain median aggregation, provider collateral staking, and automated deviation slashing on BOT Chain.
            </div>
          </div>

          {/* Col 2: BOT Chain Ecosystem & Resources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BotChainLogo size={18} />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                BOT Chain Ecosystem
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  id="footer-ecosystem-link-website"
                >
                  <BotChainLogo size={18} />
                  <span className="font-medium group-hover:text-primary transition-colors">BOT Chain Website</span>
                  <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-primary" />
                </a>
              </li>
              <li>
                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                  id="footer-ecosystem-link-explorer"
                >
                  <BotChainLogo size={18} />
                  <span className="font-medium group-hover:text-primary transition-colors">BOT Chain Explorer</span>
                  <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-primary" />
                </a>
              </li>
              <li>
                <a
                  href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <Layers className="h-3.5 w-3.5 text-accent-emerald" />
                  <span>Verified Oracle Contract</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li className="pt-2 border-t border-border/50 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Network</span>
                  <span className="font-mono text-slate-300">BOT Chain Mainnet</span>
                </div>
                <div className="flex justify-between">
                  <span>Chain ID</span>
                  <span className="font-mono text-slate-300">677</span>
                </div>
                <div className="flex justify-between">
                  <span>Native Token</span>
                  <span className="font-mono text-primary font-bold">BOT</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 3: Developer Tooling */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono mb-3">
              Developer Tooling
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/developer" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span>IBotOracle Interface</span>
                </Link>
              </li>
              <li>
                <Link href="/provider/register" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-accent-emerald" />
                  <span>Become a Data Provider</span>
                </Link>
              </li>
              <li>
                <Link href="/feeds" className="hover:text-primary transition-colors">
                  Active Price Feeds
                </Link>
              </li>
              <li>
                <Link href="/providers" className="hover:text-primary transition-colors">
                  Provider Directory
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Protocol Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Network Specs & Status */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono mb-3">
              Network Status
            </h4>
            <div className="rounded-lg border border-border bg-surface-100/60 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Consensus</span>
                <span className="font-mono text-accent-emerald flex items-center gap-1 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gas Price</span>
                <span className="font-mono text-slate-300 text-[11px]">0.000000001 BOT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Block Time</span>
                <span className="font-mono text-slate-300 text-[11px]">~2.0s</span>
              </div>
              <div className="pt-2 border-t border-border/50 text-[11px] text-slate-400">
                <p>RPC: <span className="font-mono text-slate-300">rpc.botchain.ai</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits with Logo at front of links */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <BotChainLogo size={16} />
            <span>&copy; {new Date().getFullYear()} BotOracle Protocol. Built for the BOT Chain Ecosystem.</span>
          </div>
          <div className="flex items-center gap-4 mt-3 sm:mt-0 font-mono text-[11px]">
            <a
              href="https://botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <BotChainLogo size={14} />
              <span>botchain.ai</span>
            </a>
            <span>•</span>
            <a
              href="https://scan.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <BotChainLogo size={14} />
              <span>scan.botchain.ai</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
