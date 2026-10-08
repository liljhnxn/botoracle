"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { botchain } from "../lib/chain";
import { formatAddress } from "../lib/identity";
import { BOTORACLE_ADDRESS } from "../lib/contracts/botoracle";
import {
  Activity,
  Layers,
  Users,
  Shield,
  Code2,
  Menu,
  X,
  Wallet,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdown, setWalletDropdown] = useState(false);

  const isWrongNetwork = isConnected && chainId !== botchain.id;

  const navLinks = [
    { name: "Feeds", href: "/feeds", icon: Activity },
    { name: "Providers", href: "/providers", icon: Users },
    { name: "Provider Portal", href: "/dashboard/provider", icon: Layers },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Developers", href: "/developer", icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-surface-50 border border-primary/40 shadow-glow-sm transition-all group-hover:border-primary">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold tracking-wider text-white">
              BOT<span className="text-primary">ORACLE</span>
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
              BOT Chain Mainnet
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface-50 text-primary border border-primary/30"
                    : "text-slate-300 hover:bg-surface-50/60 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Network Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Mainnet Explorer Direct Link */}
          <a
            href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-surface-50 hover:bg-surface-100 border border-border hover:border-primary/40 px-2.5 py-1.5 text-xs font-mono text-slate-300 hover:text-white transition-all group"
            title="View Protocol Contract on BotScan"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Explorer</span>
          </a>

          {/* Network Indicator */}
          {isConnected && (
            <div>
              {isWrongNetwork ? (
                <button
                  onClick={() => switchChain({ chainId: botchain.id })}
                  className="flex items-center gap-1.5 rounded-md bg-accent-amber/10 px-2.5 py-1.5 text-xs font-mono font-medium text-accent-amber border border-accent-amber/30 hover:bg-accent-amber/20 transition-all"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Switch to BOT Chain Mainnet</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-surface-50 px-2.5 py-1.5 text-xs font-mono text-slate-300 border border-border">
                  <div className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                  <span>BOT Chain Mainnet (677)</span>
                </div>
              )}
            </div>
          )}

          {/* Wallet Connect/Disconnect */}
          {!isConnected ? (
            <button
              onClick={() => {
                const connector = connectors[0];
                if (connector) connect({ connector });
              }}
              className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 hover:border-primary transition-all shadow-glow-sm"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setWalletDropdown(!walletDropdown)}
                className="flex items-center gap-2 rounded-md bg-surface-50 border border-border px-3.5 py-1.5 text-sm font-mono text-slate-200 hover:border-primary/40 transition-all"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{formatAddress(address)}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {walletDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-surface-100 border border-border p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs text-slate-400">Connected Wallet</p>
                    <p className="text-xs font-mono text-white break-all mt-0.5">{address}</p>
                  </div>
                  <div className="py-1">
                    <a
                      href={`https://scan.botchain.ai/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-50 hover:text-white"
                    >
                      <span>View in Explorer</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Link
                      href="/dashboard/provider"
                      onClick={() => setWalletDropdown(false)}
                      className="flex items-center justify-between rounded px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-50 hover:text-white"
                    >
                      <span>Provider Dashboard</span>
                    </Link>
                  </div>
                  <div className="border-t border-border/60 pt-1">
                    <button
                      onClick={() => {
                        disconnect();
                        setWalletDropdown(false);
                      }}
                      className="w-full text-left rounded px-3 py-1.5 text-xs text-accent-rose hover:bg-accent-rose/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-100 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-surface-50 hover:text-white"
            >
              <link.icon className="h-4 w-4" />
              {link.name}
            </Link>
          ))}
          <a
            href={`https://scan.botchain.ai/address/${BOTORACLE_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-surface-50 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="h-4 w-4 text-primary" />
              <span>Mainnet Explorer</span>
            </div>
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">677</span>
          </a>
          <div className="pt-3 border-t border-border mt-2">
            {!isConnected ? (
              <button
                onClick={() => {
                  const connector = connectors[0];
                  if (connector) connect({ connector });
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary/20 border border-primary/40 px-4 py-2 text-sm font-medium text-primary"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 px-3">
                  {formatAddress(address)} (BOT Chain Mainnet)
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-accent-rose hover:bg-accent-rose/10 rounded"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
