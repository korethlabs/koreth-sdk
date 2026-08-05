export interface ProtocolAddresses {
  // Core
  protocolCore: `0x${string}`;
  positionManager: `0x${string}`;
  lendingEngine: `0x${string}`;
  liquidationEngine: `0x${string}`;
  feeCollector: `0x${string}`;
  lpOracleHub: `0x${string}`;
  circuitBreaker: `0x${string}`;
  riskManager: `0x${string}`;
  poolFactory: `0x${string}`;
  poolLiquidityMonitor: `0x${string}`;
  interestRateModel: `0x${string}`;
  // Periphery
  positionViewer: `0x${string}`;
  swapRouterAdapter: `0x${string}`;
}

// Placeholder — populated after deployment
export const addresses: Record<number, ProtocolAddresses> = {
  // 1: { ... }      // Ethereum mainnet
  // 8453: { ... }   // Base
  // 42161: { ... }  // Arbitrum
};
