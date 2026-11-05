#!/usr/bin/env node

/**
 * Fail unless the contract sources behind every ABI this package extracts are
 * actually present, before anything is built or compared.
 *
 * The drift check is "regenerate and require a no-op", and a no-op is also what a
 * check that compared nothing looks like. The contract repos are cloned
 * anonymously, so there is no credential whose absence could be tested for; what
 * can be tested is the thing the credential was only ever a proxy for — that the
 * sources arrived. This also has to run before the build cache is restored: the
 * cache key is a hash of these sources, and an empty checkout hashes to a constant
 * that could restore an `out/` built from some earlier tree.
 *
 * For every name in scripts/extract-abis.js it requires exactly one `<Name>.sol`
 * under the given root's `src/`, non-empty and declaring `contract <Name>`. The
 * core names are checked twice: in core itself, and in periphery's vendored copy
 * under lib/koreth-v1-core, which is what periphery compiles against.
 *
 * Usage: CORE_ROOT=<core checkout> PERIPHERY_ROOT=<periphery checkout> \
 *          node scripts/require-contract-sources.js
 */

const fs = require('fs');
const path = require('path');
const { CORE_CONTRACTS, PERIPHERY_CONTRACTS } = require('./extract-abis');

const CORE_ROOT = process.env.CORE_ROOT;
const PERIPHERY_ROOT = process.env.PERIPHERY_ROOT;

if (!CORE_ROOT || !PERIPHERY_ROOT) {
  console.error('CORE_ROOT and PERIPHERY_ROOT must both be set.');
  process.exit(1);
}

function solFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...solFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.sol')) found.push(full);
  }
  return found;
}

let errors = 0;
let checked = 0;

function requireSources(srcDir, names, label) {
  const files = solFiles(srcDir);
  console.log(`${label}: ${files.length} .sol files under ${srcDir}`);
  for (const name of names) {
    const matches = files.filter((f) => path.basename(f) === `${name}.sol`);
    if (matches.length !== 1) {
      console.error(
        `  MISSING: ${name}.sol — expected exactly one, found ${matches.length}`
      );
      errors++;
      continue;
    }
    const source = fs.readFileSync(matches[0], 'utf-8');
    if (!new RegExp(`\\bcontract\\s+${name}\\b`).test(source)) {
      console.error(
        `  EMPTY: ${path.relative(srcDir, matches[0])} does not declare contract ${name}`
      );
      errors++;
      continue;
    }
    checked++;
  }
}

requireSources(path.join(CORE_ROOT, 'src'), CORE_CONTRACTS, 'core');
requireSources(path.join(PERIPHERY_ROOT, 'src'), PERIPHERY_CONTRACTS, 'periphery');
requireSources(
  path.join(PERIPHERY_ROOT, 'lib', 'koreth-v1-core', 'src'),
  CORE_CONTRACTS,
  "periphery's vendored core"
);

const expected = CORE_CONTRACTS.length * 2 + PERIPHERY_CONTRACTS.length;
console.log(`\n${checked}/${expected} contract sources present`);

if (errors > 0 || checked !== expected) {
  console.error(
    '\nThe contract sources did not arrive, so there is nothing to compare the committed ABIs against. Failing rather than reporting a green run that compared nothing.'
  );
  process.exit(1);
}
