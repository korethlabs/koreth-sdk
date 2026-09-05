#!/usr/bin/env node
/**
 * Checks every hand-written struct interface in src/types/ against the struct it claims to
 * mirror in src/abis/.
 *
 * WHY THIS EXISTS, AND WHY THE BUILD IS NOT ENOUGH
 *
 * The ABIs and the TypeScript interfaces are two copies of the same shapes, and until this
 * script they were independently maintainable: `generate-abis` refreshes src/abis/ from the
 * Foundry artifacts and does not look at src/types/ at all. Three transcriptions went wrong and
 * `npm run build` was green over every one of them, because a JSON import widens to `string` and
 * nothing in the type system relates the two directories. Two files checked in at the same commit
 * flatly contradicted each other and tsc had nothing to say.
 *
 * WHAT IT ASKS
 *
 * "Does this interface match the ABI sitting next to it *right now*" — recomputed from the ABI on
 * every run. Deliberately not "did this stop matching since we last looked": a snapshot-and-diff
 * guard cannot see a field that was wrong in its first commit and never changed afterwards, and
 * one of the three defects was exactly that.
 *
 * WHAT IT CANNOT SEE
 *
 * Enum *values*. Solidity compiles an enum member to its declaration index and the ABI keeps only
 * `uint8` plus an `internalType` naming the enum — never the member names. So the enum's identity
 * is checkable here, on both sides: a struct field must be typed with the right enum, and an enum
 * declaration's name must still appear in some field's `internalType`, which catches a rename or
 * a removal in core. What is unreachable is what `PositionStatus.Closed` equals — the defect that
 * actually occurred. The script prints the enums it could not fully check rather than passing
 * silently over them, so the gap is visible in the output instead of implied by its absence.
 * Closing it needs the compiler's AST, not the ABI.
 *
 * LINKAGE
 *
 * Each exported interface and enum must carry an `@abi <Fully.Qualified.Name>` JSDoc tag naming
 * its counterpart, or `@abi-none <reason>` to declare that it has none. An untagged declaration
 * is an error, not an unchecked pass — otherwise adding a new hand-written struct would silently
 * widen the blind spot this script exists to close.
 *
 * Usage: node scripts/check-types-against-abis.js [--types <dir>] [--abis <dir>]
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = { types: path.join(repoRoot, 'src/types'), abis: path.join(repoRoot, 'src/abis') };
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag !== '--types' && flag !== '--abis') {
      throw new Error(`unknown argument ${flag}`);
    }
    if (value === undefined) throw new Error(`${flag} needs a directory`);
    opts[flag.slice(2)] = path.resolve(value);
  }
  return opts;
}

/**
 * Collects every struct definition reachable anywhere in an ABI, keyed by the fully-qualified
 * name in its `internalType`. The same struct appears in many places — as a parameter, a return
 * value, nested in another struct — and every occurrence carries the full component list, so any
 * one of them is a complete definition. Where two ABIs disagree about the same name that is a
 * defect in the ABIs themselves and is reported rather than silently resolved by last-write-wins.
 */
function collectStructs(abiDir) {
  const structs = new Map(); // name -> { components, sources: Set<file>, signature }
  const enums = new Map(); // name -> Set<file>
  const conflicts = [];

  const signatureOf = (components) =>
    components.map((c) => `${c.type} ${c.name}`).join(', ');

  const visit = (node, file) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child, file);
      return;
    }
    if (typeof node.internalType === 'string' && node.internalType.startsWith('enum ')) {
      const name = node.internalType.slice('enum '.length).replace(/\[\]$/, '');
      if (!enums.has(name)) enums.set(name, new Set());
      enums.get(name).add(file);
    }
    if (typeof node.internalType === 'string' && node.internalType.startsWith('struct ') && Array.isArray(node.components)) {
      const name = node.internalType.replace(/^struct /, '').replace(/\[\]$/, '');
      const signature = signatureOf(node.components);
      const existing = structs.get(name);
      if (!existing) {
        structs.set(name, { components: node.components, sources: new Set([file]), signature });
      } else {
        existing.sources.add(file);
        if (existing.signature !== signature) {
          conflicts.push({ name, a: existing.signature, b: signature });
        }
      }
    }
    for (const key of Object.keys(node)) visit(node[key], file);
  };

  const files = fs.readdirSync(abiDir).filter((f) => f.endsWith('.json') && f !== 'index.json');
  if (files.length === 0) throw new Error(`no ABI JSON found in ${abiDir}`);
  for (const file of files) {
    visit(JSON.parse(fs.readFileSync(path.join(abiDir, file), 'utf8')), file);
  }
  return { structs, enums, conflicts };
}

/**
 * Struct fields the SDK deliberately types more narrowly than the ABI does, as `Struct.field` ->
 * the enum it is narrowed to.
 *
 * `PositionViewer` declares these three as plain `uint8` rather than as the enum, because they are
 * frontend view structs and the widening costs nothing on chain (`PositionViewer.sol:18-31, 48-57`).
 * The values are still exactly the enum's — the viewer assigns them from the enum-typed fields —
 * so typing them `number` in the SDK would discard information the protocol really does carry, and
 * push a cast onto every consumer. Adding the semantics an ABI erases is what this package is for.
 *
 * The narrowing is listed rather than inferred so that it cannot happen by accident: a rule of
 * "any enum satisfies any uint8" would also have accepted `status: LPType`, which is the exact
 * class of mistake this script exists to catch. Widening this list is a deliberate line in a diff.
 *
 * It is worth being clear about what the narrowing assumes: that the SDK's enum has every member
 * core's does. Nothing here can check that — see the enum note in the header — so an `lpType`
 * arriving as a member core added and the SDK has not will be typed `LPType` and be a value the
 * type says is impossible. That is the same exposure as the enum gap, not a new one.
 *
 * There is a second assumption, and it is the one a passing run most invites you to forget. These
 * fields come from PositionViewer, which is compiled against periphery's pinned copy of core; the
 * enum the SDK narrows to comes from core's tip. If those two disagree on member order, nothing
 * here moves: the fields are still `uint8`, so the entries below stay exercised rather than dead,
 * and the field is still enum-valued, so the narrowing is still "correct" by the only measure this
 * script has. It is an enum with different names attached. The invariant behind these three lines
 * is therefore not "the fields are uint8" but "periphery's pin and core's tip agree on the
 * ordinals" — which is not expressible from either repo's types, and is what committing
 * periphery's ABIs alongside the pin would close.
 */
const DECLARED_NARROWINGS = new Map([
  ['PositionViewer.PositionView.lpType', 'LPType'],
  ['PositionViewer.PositionView.status', 'PositionStatus'],
  ['PositionViewer.CollateralTypeView.lpType', 'LPType'],
]);

/**
 * The TypeScript type a member must be written as. Integer widths follow abitype, which the SDK's
 * consumers decode through: <= 48 bits is `number`, wider is `bigint` (`abitype`'s
 * `LessThanOrEqualTo48Bits`). Anything not listed returns null and is reported as unsupported — a
 * type this script cannot check must stop it, not pass through it.
 */
function expectedTsType(component) {
  const { type, internalType } = component;
  if (typeof internalType === 'string' && internalType.startsWith('enum ')) {
    // `enum ILPAdapter.LPType` -> `LPType`. The ABI names the enum even though it drops the
    // members, so the *identity* of the enum is checkable here even when its values are not.
    return internalType.slice('enum '.length).split('.').pop();
  }
  if (type === 'address') return '`0x${string}`';
  if (type === 'bool') return 'boolean';
  if (type === 'string') return 'string';
  const int = type.match(/^u?int(\d+)?$/);
  if (int) return Number(int[1] ?? 256) <= 48 ? 'number' : 'bigint';
  if (/^bytes(\d+)?$/.test(type)) return '`0x${string}`';
  return null;
}

/** JSDoc tag text for a declaration, or null. Reads the raw leading comment so that both
 *  `@abi` and `@abi-none` are visible without depending on how TS classifies unknown tags. */
function readAbiTag(node, sourceText) {
  const ranges = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) || [];
  for (const range of ranges) {
    const comment = sourceText.slice(range.pos, range.end);
    const none = comment.match(/@abi-none\s+(.+)/);
    if (none) return { kind: 'none', reason: none[1].replace(/\*\/\s*$/, '').trim() };
    const named = comment.match(/@abi\s+([A-Za-z0-9_.]+)/);
    if (named) return { kind: 'struct', name: named[1] };
  }
  return null;
}

function normaliseType(text) {
  return text.replace(/\s+/g, '');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { structs, enums, conflicts } = collectStructs(opts.abis);

  const problems = [];
  const checked = [];
  const declared = [];
  const skippedEnums = [];
  const narrowings = [];
  const appliedNarrowings = new Set();

  for (const { name, a, b } of conflicts) {
    problems.push(`ABI conflict: ${name} has two different shapes across src/abis/\n    ${a}\n    ${b}`);
  }

  const typeFiles = fs
    .readdirSync(opts.types)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
  if (typeFiles.length === 0) throw new Error(`no TypeScript sources found in ${opts.types}`);

  for (const file of typeFiles) {
    const fullPath = path.join(opts.types, file);
    const sourceText = fs.readFileSync(fullPath, 'utf8');
    const source = ts.createSourceFile(fullPath, sourceText, ts.ScriptTarget.ES2022, true);

    for (const statement of source.statements) {
      const exported = ts.getCombinedModifierFlags(statement) & ts.ModifierFlags.Export;
      if (!exported) continue;

      const isEnum = ts.isEnumDeclaration(statement);
      if (!isEnum && !ts.isInterfaceDeclaration(statement)) continue;

      const declName = statement.name.text;
      const tag = readAbiTag(statement, sourceText);

      if (!tag) {
        problems.push(
          `${file}:${declName} has no @abi tag. Add \`@abi <Contract.${isEnum ? 'Enum' : 'Struct'}>\` ` +
            `naming its counterpart in src/abis/, or \`@abi-none <reason>\` if it has none.`
        );
        continue;
      }
      if (tag.kind === 'none') {
        declared.push(`${file}:${declName} — no ABI counterpart (${tag.reason})`);
        continue;
      }

      // An enum's *members* are unreachable from an ABI, but its *name* is not: it survives in
      // the `internalType` of every field typed with it. So a rename or a removal in core is
      // caught here, and only the values fall through to the Solidity source.
      if (isEnum) {
        if (!enums.has(tag.name)) {
          problems.push(
            `${file}:${declName} claims @abi ${tag.name}, which no field in ` +
              `${path.relative(repoRoot, opts.abis)} is typed with. Either core renamed or removed ` +
              `it, or the tag is wrong.`
          );
        } else {
          skippedEnums.push(`${declName} mirrors ${tag.name} — name confirmed, values unverifiable here`);
        }
        continue;
      }

      const interfaceName = declName;

      const abiStruct = structs.get(tag.name);
      if (!abiStruct) {
        problems.push(
          `${file}:${interfaceName} claims @abi ${tag.name}, which is not present in any ABI in ` +
            `${path.relative(repoRoot, opts.abis)}.`
        );
        continue;
      }

      const abiFields = abiStruct.components;
      const tsFields = statement.members.filter(ts.isPropertySignature);
      const mismatches = [];

      const max = Math.max(abiFields.length, tsFields.length);
      for (let i = 0; i < max; i += 1) {
        const abiField = abiFields[i];
        const tsField = tsFields[i];

        if (!abiField) {
          mismatches.push(`[${i}] extra field \`${tsField.name.getText(source)}\` — the ABI struct has ${abiFields.length} fields`);
          continue;
        }
        if (!tsField) {
          mismatches.push(`[${i}] missing field \`${abiField.name}\` (${abiField.type})`);
          continue;
        }

        const tsName = tsField.name.getText(source);
        if (tsName !== abiField.name) {
          mismatches.push(`[${i}] name: ABI has \`${abiField.name}\`, interface has \`${tsName}\``);
          continue;
        }

        // A struct component is always present in a decoded return value, so an optional field
        // describes a shape the contract cannot produce. It would otherwise pass: the type of
        // `foo?: bigint` still reads as `bigint`, so comparing types alone cannot see it.
        if (tsField.questionToken) {
          mismatches.push(
            `[${i}] \`${tsName}\` is optional, but ABI struct components are always present`
          );
          continue;
        }

        const expected = expectedTsType(abiField);
        if (expected === null) {
          problems.push(
            `${file}:${interfaceName}.${abiField.name} has ABI type \`${abiField.type}\`, which this ` +
              `script has no mapping for. Add one rather than leaving the field unchecked.`
          );
          continue;
        }
        const actual = tsField.type ? tsField.type.getText(source) : '<none>';
        const narrowedTo = DECLARED_NARROWINGS.get(`${tag.name}.${abiField.name}`);
        if (narrowedTo && normaliseType(actual) === narrowedTo) {
          appliedNarrowings.add(`${tag.name}.${abiField.name}`);
          narrowings.push(`${interfaceName}.${abiField.name}: ${abiField.type} narrowed to ${narrowedTo}`);
          continue;
        }
        if (normaliseType(actual) !== normaliseType(expected)) {
          mismatches.push(`[${i}] \`${abiField.name}\`: ABI \`${abiField.type}\` expects \`${expected}\`, interface has \`${actual}\``);
        }
      }

      if (mismatches.length > 0) {
        problems.push(
          `${file}:${interfaceName} does not match ${tag.name} ` +
            `(from ${[...abiStruct.sources].sort().join(', ')}):\n` +
            mismatches.map((m) => `    ${m}`).join('\n')
        );
      } else {
        checked.push(`${interfaceName} == ${tag.name} (${abiFields.length} fields)`);
      }
    }
  }

  // An exception must not outlive the thing it excepts. If a declared narrowing never applied,
  // either the field moved or the SDK stopped narrowing it, and the entry is now a standing
  // permission for a mismatch nobody has looked at. Report it rather than carrying it.
  for (const key of DECLARED_NARROWINGS.keys()) {
    if (!appliedNarrowings.has(key)) {
      problems.push(
        `DECLARED_NARROWINGS has an entry for ${key} that was never exercised. The field, the ` +
          `struct or the SDK's type for it has changed — remove the entry or fix the name.`
      );
    }
  }

  for (const line of checked) console.log(`  ok   ${line}`);
  for (const line of declared) console.log(`  --   ${line}`);
  for (const line of narrowings) console.log(`  ~    ${line}`);
  if (skippedEnums.length > 0) {
    console.log(
      `\n  Enum values are not checkable here — Solidity compiles a member to its declaration\n` +
        `  index and the ABI keeps only uint8. These need the Solidity source:\n` +
        skippedEnums.map((e) => `    ${e}`).join('\n')
    );
  }

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s):\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error('');
    process.exit(1);
  }

  console.log(`\n${checked.length} interface(s) match the committed ABIs.`);
}

try {
  main();
} catch (error) {
  console.error(`check-types-against-abis: ${error.message}`);
  process.exit(1);
}
