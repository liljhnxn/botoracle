import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "../components/Web3Provider";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { BackButton } from "../components/BackButton";

export const metadata: Metadata = {
  title: "BotOracle — Decentralized Oracle Network on Botchain",
  description:
    "Trusted data for decentralized applications. BotOracle brings verified external data on-chain through independent providers, transparent aggregation, and economic incentives.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col antialiased selection:bg-primary/30 selection:text-white">
        <Web3Provider>
          <Navbar />
          <BackButton />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
