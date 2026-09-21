/**
 * @notice Resolves on-chain identity for Botchain addresses.
 * Future versions will integrate BotNS resolution (e.g. `provider.bot`).
 * Currently returns formatted address without fabricating domain names.
 */
export async function resolveIdentity(address: string | undefined): Promise<string> {
  if (!address) return "";
  
  // Future BotNS lookup placeholder:
  // try {
  //   const botnsName = await botnsClient.lookupAddress(address);
  //   if (botnsName) return botnsName;
  // } catch (e) {}

  return address;
}

/**
 * Truncates an Ethereum/Botchain address for compact UI display (e.g. 0x1234...abcd)
 */
export function formatAddress(address: string | undefined): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats explorer transaction link
 */
export function getExplorerTxUrl(txHash: string): string {
  return `https://scan.bohr.life/tx/${txHash}`;
}

/**
 * Formats explorer address link
 */
export function getExplorerAddressUrl(address: string): string {
  return `https://scan.bohr.life/address/${address}`;
}
