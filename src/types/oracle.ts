/**
 * The haircut is not part of this shape — it is a risk parameter held per collateral type in
 * `RiskManager`, and reaches callers through `CollateralConfig`.
 *
 * @abi ILPOracleHub.PriceResult
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

/**
 * Labels for the pricing method behind a quote, for logging and display. Not a transcription:
 * core declares exactly two enums, `LPType` and `PositionStatus`, and neither is this one. The
 * hub routes on `LPType` — `getPrice` resolves `core.getOracle(lpType)` and delegates — so the
 * method is a property of whichever sub-oracle is wired to that type, named nowhere on chain and
 * crossing no ABI boundary.
 *
 * @abi-none SDK-side labels, no Solidity counterpart
 */
export enum OracleSource {
  ChainlinkTWAP = 'chainlink_twap',
  UniswapTWAP = 'uniswap_twap',
  CurveVirtualPrice = 'curve_virtual_price',
}
