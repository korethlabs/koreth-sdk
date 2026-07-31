#!/usr/bin/env node

/**
 * Extract ABIs from the Foundry build output of koreth-v1-core and
 * koreth-v1-periphery, and write them into this SDK (src/abis) so the
 * package is self-contained and can be published without the contracts.
 *
 * Run after `forge build` in both contract repos.
 *
 * Override source locations with CORE_OUT / PERIPHERY_OUT env vars.
 * Defaults assume the sibling-repo layout under ~/Developers/koreth/.
 *
 * Usage: node scripts/extract-abis.js
 */

const fs = require('fs');
const path = require('path');

const CORE_OUT =
  process.env.CORE_OUT || path.resolve(__dirname, '../../koreth-v1-core/out');
const PERIPHERY_OUT =
  process.env.PERIPHERY_OUT ||
  path.resolve(__dirname, '../../koreth-v1-periphery/out');
const ABIS_DIR = path.resolve(__dirname, '../src/abis');

const CORE_CONTRACTS = [
  'ProtocolCore',
  'PositionManager',
  'LendingEngine',
  'LiquidationEngine',
  'FeeCollector',
  'LPOracleHub',
  'LendingPool',
  'PoolFactory',
  'InterestRateModel',
  'CircuitBreaker',
  'RiskManager',
  'PoolHealthMonitor',
];

const PERIPHERY_CONTRACTS = [
  'PositionViewer',
  'LeverageTransformer',
  'CompoundSwapRouter',
  'LPCompounder',
  'FlashloanLiquidator',
  'SwapRouterAdapter',
];

if (!fs.existsSync(ABIS_DIR)) {
  fs.mkdirSync(ABIS_DIR, { recursive: true });
}

let extracted = 0;
let missing = 0;

function extract(outDir, names, label) {
  console.log(`\n${label} (${outDir}):`);
  for (const name of names) {
    const artifactPath = path.join(outDir, `${name}.sol`, `${name}.json`);

    if (!fs.existsSync(artifactPath)) {
      console.warn(`  SKIP: ${name} (not found)`);
      missing++;
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
    const abi = artifact.abi;

    if (!abi) {
      console.warn(`  SKIP: ${name} (no ABI in artifact)`);
      missing++;
      continue;
    }

    fs.writeFileSync(
      path.join(ABIS_DIR, `${name}.json`),
      JSON.stringify(abi, null, 2)
    );
    console.log(`  OK: ${name} (${abi.length} entries)`);
    extracted++;
  }
}

extract(CORE_OUT, CORE_CONTRACTS, 'core');
extract(PERIPHERY_OUT, PERIPHERY_CONTRACTS, 'periphery');

const total = CORE_CONTRACTS.length + PERIPHERY_CONTRACTS.length;
console.log(`\nExtracted ${extracted}/${total} ABIs to ${ABIS_DIR}`);

if (missing > 0) {
  console.error(
    `\n${missing} ABI(s) missing — did you run \`forge build\` in both repos?`
  );
  process.exit(1);
}
