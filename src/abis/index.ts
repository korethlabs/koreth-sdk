// Core
import ProtocolCore from './ProtocolCore.json';
import PositionManager from './PositionManager.json';
import LendingEngine from './LendingEngine.json';
import LiquidationEngine from './LiquidationEngine.json';
import FeeCollector from './FeeCollector.json';
import LPOracleHub from './LPOracleHub.json';
import LendingPool from './LendingPool.json';
import PoolFactory from './PoolFactory.json';
import InterestRateModel from './InterestRateModel.json';
import CircuitBreaker from './CircuitBreaker.json';
import RiskManager from './RiskManager.json';
import PoolHealthMonitor from './PoolHealthMonitor.json';

// Periphery
import PositionViewer from './PositionViewer.json';
import LeverageTransformer from './LeverageTransformer.json';
import CompoundSwapRouter from './CompoundSwapRouter.json';
import LPCompounder from './LPCompounder.json';
import FlashloanLiquidator from './FlashloanLiquidator.json';
import SwapRouterAdapter from './SwapRouterAdapter.json';

export const abis = {
  ProtocolCore,
  PositionManager,
  LendingEngine,
  LiquidationEngine,
  FeeCollector,
  LPOracleHub,
  LendingPool,
  PoolFactory,
  InterestRateModel,
  CircuitBreaker,
  RiskManager,
  PoolHealthMonitor,
  PositionViewer,
  LeverageTransformer,
  CompoundSwapRouter,
  LPCompounder,
  FlashloanLiquidator,
  SwapRouterAdapter,
} as const;

export type ContractName = keyof typeof abis;
