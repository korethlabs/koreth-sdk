export enum LPType {
  UniswapV2 = 0,
  UniswapV3 = 1,
  Curve = 2,
  Aerodrome = 3,
  PancakeSwapV2 = 4,
  PancakeSwapV3 = 5,
}

export enum PositionStatus {
  Active = 0,
  Borrowed = 1,
  Liquidated = 2,
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
