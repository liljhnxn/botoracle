"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Do not show back button on the root home page
  if (!pathname || pathname === "/") {
    return null;
  }

  // Generate readable breadcrumbs based on pathname
  const segments = pathname.split("/").filter(Boolean);

  const getSegmentLabel = (segment: string, index: number, allSegments: string[]) => {
    if (segment === "feeds") return "Feeds";
    if (segment === "providers") return "Providers";
    if (segment === "admin") return "Admin Portal";
    if (segment === "developer") return "Developers";
    if (segment === "dashboard") return "Dashboard";
    if (segment === "provider") {
      if (allSegments[index - 1] === "dashboard") return "Provider Portal";
      return "Provider";
    }
    if (segment === "register") return "Register";
    if (segment === "feed") return "Feed";
    if (segment === "round") return "Round";
    
    // Numeric IDs or hashes
    if (/^\d+$/.test(segment)) {
      const prev = allSegments[index - 1];
      if (prev === "feed") return `Feed #${segment}`;
      if (prev === "round") return `Feed #${segment}`;
      if (index === 2 && allSegments[0] === "round") return `Round #${segment}`;
      return `#${segment}`;
    }

    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback if accessed directly from external link
      if (pathname.startsWith("/feed/")) {
        router.push("/feeds");
      } else if (pathname.startsWith("/round/")) {
        const parts = pathname.split("/").filter(Boolean);
        if (parts[1]) {
          router.push(`/feed/${parts[1]}`);
        } else {
          router.push("/feeds");
        }
      } else if (pathname.startsWith("/provider/register")) {
        router.push("/providers");
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="w-full border-b border-border/50 bg-surface-100/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Universal Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-50/80 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 transition-all hover:border-primary/50 hover:bg-surface-50 hover:text-primary active:scale-95 shadow-sm"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-primary" />
            <span>Back</span>
          </button>

          <span className="h-3.5 w-[1px] bg-border/80 hidden sm:inline-block" />

          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-primary transition-colors py-0.5"
            >
              <Home className="h-3 w-3" />
              <span>Home</span>
            </Link>

            {segments.map((seg, idx) => {
              const href = "/" + segments.slice(0, idx + 1).join("/");
              const isLast = idx === segments.length - 1;
              const label = getSegmentLabel(seg, idx, segments);

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                  {isLast ? (
                    <span className="text-white font-medium">{label}</span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-primary transition-colors py-0.5"
                    >
                      {label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Current Network Pill / Context */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>BOT Chain Mainnet (677)</span>
        </div>
      </div>
    </div>
  );
}
