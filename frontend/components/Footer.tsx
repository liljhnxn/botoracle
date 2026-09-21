import React from "react";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-surface-200/90 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-mono text-base font-bold text-white tracking-wider">
                BOT<span className="text-primary">ORACLE</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              &ldquo;Trusted data for decentralized applications.&rdquo;
            </p>
            <div className="rounded-lg bg-surface-100/80 border border-border p-3 text-[11px] leading-relaxed text-slate-400 max-w-lg">
              <span className="font-semibold text-primary flex items-center gap-1 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Oracle Security Principles
              </span>
              BotOracle does not claim independent knowledge of external truth. Protocol security
              derives from provider diversity, transparent median aggregation, stake collateral (BOT),
              and deterministic on-chain deviation slashing.
            </div>
          </div>

          {/* Col 2: Network & Resources */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono mb-3">
              Network Specs
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between">
                <span>Network</span>
                <span className="font-mono text-slate-300">Botchain Testnet</span>
              </li>
              <li className="flex justify-between">
                <span>Chain ID</span>
                <span className="font-mono text-slate-300">968</span>
              </li>
              <li className="flex justify-between">
                <span>Native Token</span>
                <span className="font-mono text-primary">BOT</span>
              </li>
              <li className="pt-1">
                <a
                  href="https://scan.bohr.life"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <span>BohrScan Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Developer & Tools */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono mb-3">
              Developer Tooling
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/developer" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>IBotOracle Interface</span>
                </Link>
              </li>
              <li>
                <Link href="/provider/register" className="hover:text-primary transition-colors">
                  Become a Data Provider
                </Link>
              </li>
              <li>
                <Link href="/feeds" className="hover:text-primary transition-colors">
                  Active Price Feeds
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-primary transition-colors">
                  Protocol Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} BotOracle Decentralized Oracle Protocol. Production MVP.</p>
          <p className="font-mono text-slate-400 mt-2 sm:mt-0">Deterministic On-Chain Settlement</p>
        </div>
      </div>
    </footer>
  );
}
