# Koreth SDK

TypeScript SDK for the **Koreth** protocol. Ships the pieces an app, indexer, or
keeper needs to talk to the contracts:

- **Types** — `Position`, `PositionView`, `MarketConfig`, `MarketView`, `PriceResult`, and the
  `LPType` / `PositionStatus` / `OracleSource` enums, mirroring the on-chain structs.
- **ABIs** — extracted from [`koreth-v1-core`](https://github.com/korethlabs/koreth-v1-core)
  and [`koreth-v1-periphery`](https://github.com/korethlabs/koreth-v1-periphery), committed here so
  the package is self-contained.
- **Addresses** — per-chain deployed contract addresses (populated after deployment).
- **Chains** — RPC / explorer / multicall config for the supported networks.
- **Constants** — default risk parameters per `LPType` and protocol fee settings.

## Install

```bash
npm install @koreth/sdk
```

## Usage

```ts
import { abis, riskParams, LPType, type PositionView } from '@koreth/sdk';

const lendingEngineAbi = abis.LendingEngine;
const v3Params = riskParams[LPType.UniswapV3]; // { maxLtvBps: 6500, ... }
```

## ABIs

ABIs live in `src/abis/*.json`, generated from the contract repos' Foundry build output:

```bash
# after `forge build` in koreth-v1-core and koreth-v1-periphery
npm run generate-abis
```

By default the script reads sibling repos at `../koreth-v1-core/out` and
`../koreth-v1-periphery/out`. Override with `CORE_OUT` / `PERIPHERY_OUT`.

## Build

```bash
npm install
npm run build
```

## License

`MIT` (see [LICENSE](./LICENSE)) — permissive so integrators can use the SDK freely.
