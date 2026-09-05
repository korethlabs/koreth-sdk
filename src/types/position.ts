/**
 * `ILPAdapter.LPType`. As with `PositionStatus`, the numeric values are the on-chain encoding and
 * are checkable only against core's Solidity source — the ABI carries the enum's name but not its
 * members.
 *
 * @abi ILPAdapter.LPType
 */
export enum LPType {
  UniswapV2 = 0,
  UniswapV3 = 1,
  Curve = 2,
  Aerodrome = 3,
  PancakeSwapV2 = 4,
  PancakeSwapV3 = 5,
}

/**
 * The numeric values are the on-chain encoding: Solidity derives
 * them from declaration order in the interface, so every value here must equal its member's position
 * there. TypeScript does not derive anything from the order of these declarations — only the explicit
 * values are read — which is why a wrong value is invisible to the compiler and silently relabels
 * every status the protocol reports. Nor can the ABI catch it: enum member names are not carried in
 * the ABI, only `internalType`, so this is checkable against core's Solidity source and nowhere else.
 *
 * @abi IPositionManager.PositionStatus
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

/** @abi IPositionManager.Position */
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

/** @abi PositionViewer.PositionView */
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
