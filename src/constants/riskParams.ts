import { LPType } from '../types/position';

/**
 * Reference risk parameters per collateral type, mirroring `RiskManager.CollateralConfig`.
 * The listing gates that used to sit alongside these (`minPoolTvl`, `minPoolAge`) were
 * per-market and no longer exist: collateral is whitelisted by LP type, not per pool.
 */
export interface RiskParams {
  maxLtvBps: number;
  liquidationThresholdBps: number;
  liquidationBonusBps: number;
  haircutBps: number;
}

export const riskParams: Record<LPType, RiskParams> = {
  [LPType.UniswapV2]: {
    maxLtvBps: 7000,
    liquidationThresholdBps: 8000,
    liquidationBonusBps: 500,
    haircutBps: 500,
  },
  [LPType.UniswapV3]: {
    maxLtvBps: 6500,
    liquidationThresholdBps: 7500,
    liquidationBonusBps: 500,
    haircutBps: 700,
  },
  [LPType.Curve]: {
    maxLtvBps: 8500,
    liquidationThresholdBps: 9000,
    liquidationBonusBps: 300,
    haircutBps: 300,
  },
  [LPType.Aerodrome]: {
    maxLtvBps: 6000,
    liquidationThresholdBps: 7000,
    liquidationBonusBps: 600,
    haircutBps: 800,
  },
  [LPType.PancakeSwapV2]: {
    maxLtvBps: 6500,
    liquidationThresholdBps: 7500,
    liquidationBonusBps: 500,
    haircutBps: 700,
  },
  [LPType.PancakeSwapV3]: {
    maxLtvBps: 6000,
    liquidationThresholdBps: 7000,
    liquidationBonusBps: 600,
    haircutBps: 800,
  },
};
