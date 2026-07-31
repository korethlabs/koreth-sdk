import { LPType } from './position';

/**
 * Shared-pool model: one LendingPool per borrow asset, with risk parameters held per
 * collateral type in RiskManager. Liquidity and risk are orthogonal — a single pool backs
 * every collateral type — so they are separate shapes rather than one merged config.
 */

/** `ILendingPool.PoolConfig` — liquidity concern only. */
export interface PoolConfig {
  borrowAsset: `0x${string}`;
}

/** `ILendingPool.PoolState`. */
export interface PoolState {
  totalSupply: bigint;
  totalBorrow: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  utilization: bigint;
  lastAccrualTimestamp: bigint;
}

/** `PositionViewer.PoolView`. */
export interface PoolView {
  borrowAsset: `0x${string}`;
  pool: `0x${string}`;
  totalSupply: bigint;
  totalBorrow: bigint;
  utilization: bigint;
  supplyRateAPR: bigint;
  borrowRateAPR: bigint;
}

/** `RiskManager.CollateralConfig` — risk parameters keyed by LP type. */
export interface CollateralConfig {
  maxLtv: bigint;
  liquidationThreshold: bigint;
  liquidationBonus: bigint;
  haircut: bigint;
  /** Max USD borrowable against this collateral type. `RiskManager.NO_BORROW_CAP` = uncapped. */
  borrowCap: bigint;
  enabled: boolean;
}

/** `PositionViewer.CollateralTypeView` — the config plus current exposure. */
export interface CollateralTypeView {
  lpType: LPType;
  maxLtv: bigint;
  liquidationThreshold: bigint;
  liquidationBonus: bigint;
  haircut: bigint;
  borrowCap: bigint;
  /** USD (18-dec) currently borrowed against this collateral type, across all pools. */
  currentBorrows: bigint;
  enabled: boolean;
}
