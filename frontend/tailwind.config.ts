import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        surface: {
          50: "#181b24",
          100: "#141720",
          200: "#0f1118",
          DEFAULT: "#0f1118",
          card: "rgba(18, 22, 33, 0.7)",
        },
        border: {
          DEFAULT: "#1f2434",
          light: "#2b3247",
          glow: "rgba(6, 182, 212, 0.25)",
        },
        primary: {
          DEFAULT: "#06b6d4", // Cyan
          hover: "#0891b2",
          glow: "rgba(6, 182, 212, 0.4)",
        },
        accent: {
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(6, 182, 212, 0.2)",
        "glow-sm": "0 0 15px -3px rgba(6, 182, 212, 0.25)",
        "glow-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
