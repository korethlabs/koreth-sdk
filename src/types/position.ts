export enum LPType {
  UniswapV2 = 0,
  UniswapV3 = 1,
  Curve = 2,
  Aerodrome = 3,
  PancakeSwapV2 = 4,
  PancakeSwapV3 = 5,
}

/**
 * `IPositionManager.PositionStatus`. The ordinals are the on-chain encoding, so they must match
 * the declaration order in the interface exactly — a member added here out of order silently
 * relabels every status the protocol reports.
 */
export enum PositionStatus {
  /** LP deposited, no debt. */
  Active = 0,
  /** LP deposited, has outstanding debt. */
  Borrowed = 1,
  /** User withdrew the LP after repaying in full. */
  Closed = 2,
  /** Position was seized by a liquidator. */
  Liquidated = 3,
}

export interface Position {
  id: bigint;
  owner: `0x${string}`;
  lpToken: `0x${string}`;
  tokenId: bigint;
  amount: bigint;
  lpType: LPType;
  pool: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  /**
   * The ERC-20 the position borrows — e.g. USDC, not a pool address. It keys the shared lending
   * pool via `ProtocolCore.pools(borrowAsset)`. Distinct from `pool` above, which is the AMM
   * pair the LP token belongs to.
   */
  borrowAsset: `0x${string}`;
  status: PositionStatus;
  depositTimestamp: bigint;
  /** Block number at deposit — the borrow cooldown is measured against it. */
  depositBlock: bigint;
  /** 18-dec USD value recorded into RiskManager supply at deposit, so a debt-free exit
   *  unwinds the amount that went in rather than re-pricing through the oracle. */
  recordedValue: bigint;
}

export interface PositionView {
  id: bigint;
  owner: `0x${string}`;
  lpToken: `0x${string}`;
  tokenId: bigint;
  amount: bigint;
  lpType: LPType;
  status: PositionStatus;
  collateralValue: bigint;
  debt: bigint;
  healthFactor: bigint;
  maxBorrow: bigint;
  availableToBorrow: bigint;
}
