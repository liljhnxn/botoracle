import { DataSource } from "./DataSource";

/**
 * @class MockSource
 * @notice Deterministic mock data source for development, testing, and isolated environments.
 */
export class MockSource implements DataSource {
  readonly name = "MockSource (Deterministic Development Feed)";

  private baselinePrices: Record<string, number> = {
    "BTC/USD": 112470.0,
    "ETH/USD": 4120.0,
    "BOT/USD": 1.5,
    "EUR/USD": 1.085,
  };

  async getValue(symbol: string): Promise<number> {
    const base = this.baselinePrices[symbol.toUpperCase()] || 100.0;
    // Tiny deterministic variance based on current minute
    const minute = new Date().getMinutes();
    const drift = Math.sin(minute) * (base * 0.002);
    return Number((base + drift).toFixed(4));
  }
}
