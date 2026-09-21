/**
 * @interface DataSource
 * @notice Pluggable adapter interface for external data providers.
 */
export interface DataSource {
  /**
   * Human-readable name of this data source adapter.
   */
  readonly name: string;

  /**
   * Fetches the current floating/numeric price for a given feed symbol.
   * @param symbol Feed symbol (e.g. "BTC/USD", "ETH/USD", "BOT/USD").
   * @returns Unscaled numerical value (e.g. 112470.50).
   */
  getValue(symbol: string): Promise<number>;
}
