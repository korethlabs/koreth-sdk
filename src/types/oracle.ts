/**
 * `ILPOracleHub.PriceResult`. The haircut is not part of this shape — it is a risk parameter
 * held per collateral type in `RiskManager`, and reaches callers through `CollateralConfig`.
 */
export interface PriceResult {
  /** USD value, 18 decimals. */
  totalValue: bigint;
  /** Value of the underlying tokens. */
  principalValue: bigint;
  /** Value of unclaimed fees. */
  feeValue: bigint;
  /** Oracle confidence, 0-10000 bps. */
  confidence: bigint;
  timestamp: bigint;
}

export enum OracleSource {
  ChainlinkTWAP = 'chainlink_twap',
  UniswapTWAP = 'uniswap_twap',
  CurveVirtualPrice = 'curve_virtual_price',
}
