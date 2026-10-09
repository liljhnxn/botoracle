import React from "react";

interface BotChainLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSize?: "xs" | "sm" | "base" | "lg";
}

export function BotChainLogo({
  className = "",
  size = 20,
  showText = false,
  textSize = "sm",
}: BotChainLogoProps) {
  const textSizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/botchain_logo.jpg"
        alt="BOT Chain Logo"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="rounded-md object-contain shrink-0 shadow-sm"
      />
      {showText && (
        <span className={`font-mono font-bold tracking-wider text-white ${textSizeMap[textSize]}`}>
          BOT <span className="text-primary">CHAIN</span>
        </span>
      )}
    </span>
  );
}
