/**
 * B2 phase 2: populate the domain model from what the archive already knows.
 *
 * Three sources, none of them invented:
 *   - the newest parsed Petrobangla document (public/data/petrobangla/daily),
 *     whose `entities` collection lists every gas field with its reported
 *     production and capacity, and whose meta carries the PDF's content hash —
 *     so every GasField row and every gas Observation cites a SourceDocument
 *     with the exact bytes it was read from;
 *   - the newest GRID_PLANTS day whose PGCB workbook is still held locally
 *     (scratch/downloads), so PowerPlant rows can cite a hashed document too.
 *     When no workbook is on disk the plants are still created — PGCB
 *     published them — but with no SourceDocument and no Observation, and the
 *     run says so: a capacity nobody can trace to bytes is a fact, not a
 *     measurement;
 *   - the FIELD_COMPANY map (scripts/fix-gas-rollups.mjs), itself read off days
 *     where rollup and document agree, for gas-field operators.
 *
 * What it refuses to do: parse "1*235+1*125" into 360 MW (that is derivation,
 * and the row's installedMw is null for a reason); treat "IPP", "QRPP", "RPP"
 * or "SIPP,REB" as companies (they are plant classes — organizationId stays
 * null); model the R-LNG terminal as a gas field. Dual-fuel plants ("Gas/HSD")
 * keep their primary fuel; the secondary is reported as lost, not silently.
 *
 * Idempotent: everything upserts on its unique name or hash. Dry-run by
 * default; --write applies.
 *
 *   npx tsx scripts/backfill-domain-entities.ts
 *   npx tsx scripts/backfill-domain-entities.ts --write
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { FuelKind, OrganizationKind } from '@prisma/client';
import { createScriptPrismaClient } from '../prisma/client';

const WRITE = process.argv.includes('--write');
const prisma = createScriptPrismaClient();
const BST = '+06:00';

/** Field -> operator code, from fix-gas-rollups.mjs (evidence-derived there). */
const FIELD_COMPANY: Record<string, string> = {
  Titas: 'BGFCL', Habiganj: 'BGFCL', Bakhrabad: 'BGFCL', Narsingdi: 'BGFCL', Meghna: 'BGFCL',
  Sylhet: 'SGFL', 'Kailashtila #1 (Silicagel)': 'SGFL', 'Kailashtila #2 (MSTE)': 'SGFL',
  Rashidpur: 'SGFL', Beanibazar: 'SGFL',
  Salda: 'BAPEX', Fenchuganj: 'BAPEX', Shahbazpur: 'BAPEX', Semutung: 'BAPEX',
  Sundalpur: 'BAPEX', Srikail: 'BAPEX', Begumganj: 'BAPEX', Rupganj: 'BAPEX',
  Jalalabad: 'CHEVRON', Maulavibazar: 'CHEVRON', Bibiyana: 'CHEVRON',
  Bangora: 'TULLOW',
};

const ORGANIZATIONS: Record<string, { name: string; kind: OrganizationKind; country?: string }> = {
  BGFCL: { name: 'Bangladesh Gas Fields Company Limited', kind: 'OPERATOR' },
  SGFL: { name: 'Sylhet Gas Fields Limited', kind: 'OPERATOR' },
  BAPEX: { name: 'Bangladesh Petroleum Exploration & Production Company Limited', kind: 'OPERATOR' },
  CHEVRON: { name: 'Chevron Bangladesh', kind: 'OPERATOR', country: 'US' },
  TULLOW: { name: 'Tullow Bangladesh', kind: 'OPERATOR', country: 'GB' },
  RPGCL: { name: 'Rupantarita Prakritik Gas Company Limited', kind: 'OPERATOR' },
  BPDB: { name: 'Bangladesh Power Development Board', kind: 'UTILITY' },
  PGCB: { name: 'Power Grid Company of Bangladesh', kind: 'UTILITY' },
  BERC: { name: 'Bangladesh Energy Regulatory Commission', kind: 'REGULATOR' },
  MPEMR: { name: 'Ministry of Power, Energy & Mineral Resources', kind: 'GOVERNMENT' },
  EGCB: { name: 'Electricity Generation Company of Bangladesh', kind: 'OWNER' },
  RPCL: { name: 'Rural Power Company Limited', kind: 'OWNER' },
  CPGCL: { name: 'Coal Power Generation Company Bangladesh Limited', kind: 'OWNER' },
  APSCL: { name: 'Ashuganj Power Station Company Limited', kind: 'OWNER' },
  NWPGCL: { name: 'North-West Power Generation Company Limited', kind: 'OWNER' },
  BCPCL: { name: 'Bangladesh-China Power Company (Pvt.) Limited', kind: 'OWNER' },
  RNPL: { name: 'RPCL-Norinco International Power Limited', kind: 'OWNER' },
  NENP: { name: 'North-East Nuclear Power Company Limited', kind: 'OWNER' },
};

/** PGCB's producer column -> organization code; plant classes map to null. */
const PRODUCER_ORG: Record<string, string | null> = {
  PDB: 'BPDB', 'SBU,PDB': 'BPDB', 'PDB-RPCL': 'RPCL',
  EGCB: 'EGCB', RPCL: 'RPCL', CPGCL: 'CPGCL', APSCL: 'APSCL', NWPGCL: 'NWPGCL',
  BCPCL: 'BCPCL', RNPL: 'RNPL', NENP: 'NENP',
  IPP: null, QRPP: null, RPP: null, 'SIPP,REB': null, Import: null,
};

const FUEL: Record<string, FuelKind> = {
  Gas: 'GAS', HFO: 'HFO', Solar: 'SOLAR', Hydro: 'HYDRO', Coal: 'COAL', Wind: 'WIND',
  Import: 'IMPORT', HSD: 'HSD', 'Gas/HSD': 'GAS', 'HFO/Gas': 'HFO', 'HSD/Gas': 'HSD',
};

const notes: string[] = [];
const refused: string[] = [];
const counts: Record<string, number> = {};
const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);

function bst(date: string, hour: number) {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00${BST}`);
}

async function upsertOrganization(code: string) {
  const def = ORGANIZATIONS[code];
  if (!def) throw new Error(`no organization definition for ${code}`);
  bump('organizations');
  if (!WRITE) return { id: `dry:${code}` };
  return prisma.organization.upsert({
    where: { name: def.name },
    create: { name: def.name, shortName: code, kind: def.kind, country: def.country ?? 'BD' },
    update: { shortName: code, kind: def.kind },
    select: { id: true },
  });
}

async function upsertSourceDocument(input: {
  publisher: 'PGCB' | 'PETROBANGLA';
  filename: string;
  sha: string;
  windowStart: Date;
  windowEnd: Date;
  parserVersion: string | null;
}) {
  bump('sourceDocuments');
  if (!WRITE) return { id: `dry:doc:${input.sha.slice(0, 8)}` };
  return prisma.sourceDocument.upsert({
    where: { publisher_contentSha256: { publisher: input.publisher, contentSha256: input.sha } },
    create: {
      publisher: input.publisher,
      filename: input.filename,
      contentSha256: input.sha,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      parserVersion: input.parserVersion,
    },
    update: { filename: input.filename, parserVersion: input.parserVersion },
    select: { id: true },
  });
}

async function observe(input: {
  sourceDocumentId: string;
  subjectType: string;
  subjectId: string;
  metric: string;
  value: number | null | undefined;
  unit: string;
  windowStart: Date;
  windowEnd: Date;
}) {
  if (typeof input.value !== 'number' || !Number.isFinite(input.value)) return; // absent stays absent
  bump('observations');
  if (!WRITE) return;
  const exists = await prisma.observation.findFirst({
    where: {
      sourceDocumentId: input.sourceDocumentId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      metric: input.metric,
    },
    select: { id: true },
  });
  if (exists) return;
  await prisma.observation.create({
    data: {
      sourceDocumentId: input.sourceDocumentId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      metric: input.metric,
      value: input.value,
      unit: input.unit,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      basis: 'REPORTED',
    },
  });
}

// ── gas side ───────────────────────────────────────────────────────────────
async function backfillGas() {
  const dir = path.join(process.cwd(), 'public', 'data', 'petrobangla', 'daily');
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  let doc: any = null;
  for (let i = files.length - 1; i >= 0 && !doc; i--) {
    const j = JSON.parse(readFileSync(path.join(dir, files[i]), 'utf8'));
    if (j?.meta?.parse_status === 'ok' && j.meta.content_sha256 && Array.isArray(j.entities)) doc = j;
  }
  if (!doc) { refused.push('gas: no parsed document with a content hash and entities'); return; }

  const start = doc.report?.gas_day_start as string | undefined;
  const end = doc.report?.gas_day_end as string | undefined;
  if (!start || !end) { refused.push('gas: newest document carries no gas_day_start/end'); return; }
  const windowStart = bst(start, 8);
  const windowEnd = bst(end, 8);
  notes.push(`gas source: ${doc.meta.source_filename} (sha ${doc.meta.content_sha256.slice(0, 12)}…), window ${start} 08:00 → ${end} 08:00 BST`);

  const source = await upsertSourceDocument({
    publisher: 'PETROBANGLA',
    filename: doc.meta.source_filename,
    sha: doc.meta.content_sha256,
    windowStart,
    windowEnd,
    parserVersion: doc.meta.parser_version ?? null,
  });

  const orgIds: Record<string, string> = {};
  for (const code of ['BGFCL', 'SGFL', 'BAPEX', 'CHEVRON', 'TULLOW', 'RPGCL']) {
    orgIds[code] = (await upsertOrganization(code)).id;
  }

  for (const e of doc.entities.filter((x: any) => x.type === 'gas_field')) {
    const name = String(e.name);
    if (name === 'R-LNG Terminal') { notes.push('gas: "R-LNG Terminal" skipped — an LNG facility, not a gas field'); continue; }
    const operator = FIELD_COMPANY[name];
    if (!operator) { refused.push(`gas field "${name}" has no operator in FIELD_COMPANY — left out`); continue; }
    bump('gasFields');
    const capacity = typeof e.capacity_mmcfd === 'number' ? e.capacity_mmcfd : null;
    let fieldId = `dry:field:${name}`;
    if (WRITE) {
      const row = await prisma.gasField.upsert({
        where: { name },
        create: { name, operatorId: orgIds[operator], capacityMmcfd: capacity },
        update: { operatorId: orgIds[operator], capacityMmcfd: capacity },
        select: { id: true },
      });
      fieldId = row.id;
    }
    await observe({ sourceDocumentId: source.id, subjectType: 'GasField', subjectId: fieldId, metric: 'gas_production', value: e.gas_mmcfd, unit: 'MMCFD', windowStart, windowEnd });
    await observe({ sourceDocumentId: source.id, subjectType: 'GasField', subjectId: fieldId, metric: 'production_capacity', value: capacity, unit: 'MMCFD', windowStart, windowEnd });
  }
}

// ── grid side ──────────────────────────────────────────────────────────────
function filedName(energyDay: string) {
  // PGCB files energy day D as D+1 (observation-window.ts).
  const d = new Date(`${energyDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `Daily Report ${dd}-${mm}-${d.getUTCFullYear()}.xlsx`;
}

async function backfillGrid() {
  const dir = path.join(process.cwd(), 'public', 'data', 'plants');
  const days = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, -5)).sort();
  if (!days.length) { refused.push('grid: no plants feed days'); return; }

  const downloads = path.join(process.cwd(), 'scratch', 'downloads');
  let chosen = days[days.length - 1];
  let workbook: string | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    const candidate = path.join(downloads, filedName(days[i]));
    if (existsSync(candidate)) { chosen = days[i]; workbook = candidate; break; }
  }
  const feed = JSON.parse(readFileSync(path.join(dir, `${chosen}.json`), 'utf8'));
  const windowStart = bst(chosen, 0);
  const windowEnd = bst(filedName(chosen).slice(13, 23).split('-').reverse().join('-'), 0);

  let sourceId: string | null = null;
  if (workbook) {
    const sha = createHash('sha256').update(readFileSync(workbook)).digest('hex');
    sourceId = (await upsertSourceDocument({ publisher: 'PGCB', filename: path.basename(workbook), sha, windowStart, windowEnd, parserVersion: null })).id;
    notes.push(`grid source: energy day ${chosen} from ${path.basename(workbook)} (sha ${sha.slice(0, 12)}…)`);
  } else {
    notes.push(`grid source: energy day ${chosen} — NO local workbook; plants created without a SourceDocument or Observations`);
  }

  const orgIds: Record<string, string> = {};
  for (const code of ['BPDB', 'PGCB', 'BERC', 'MPEMR', 'EGCB', 'RPCL', 'CPGCL', 'APSCL', 'NWPGCL', 'BCPCL', 'RNPL', 'NENP']) {
    orgIds[code] = (await upsertOrganization(code)).id;
  }

  const lostSecondary: string[] = [];
  for (const p of feed.plants as any[]) {
    const name = String(p.name).trim();
    const capacity = typeof p.installedMw === 'number' ? p.installedMw : null;

    if (p.fuel === 'Import') {
      const country = /nepal/i.test(name) ? 'NP' : /tripura|bheramara|adani|jharkhand/i.test(name) ? 'IN' : null;
      if (!country) { refused.push(`import row "${name}": counterparty not identifiable from the row`); continue; }
      bump('interconnectors');
      if (WRITE) {
        await prisma.interconnector.upsert({
          where: { name },
          create: { name, counterpartyCountry: country, capacityMw: capacity },
          update: { counterpartyCountry: country, capacityMw: capacity },
        });
      }
      continue;
    }

    const fuel = FUEL[p.fuel];
    if (!fuel) { refused.push(`plant "${name}": unmapped fuel "${p.fuel}"`); continue; }
    if (/\//.test(p.fuel)) lostSecondary.push(name);
    if (!(p.producer in PRODUCER_ORG)) { refused.push(`plant "${name}": unmapped producer "${p.producer}"`); continue; }
    const orgCode = PRODUCER_ORG[p.producer];
    if (capacity === null) bump('plantsWithoutCapacity');
    bump('powerPlants');
    let plantId = `dry:plant:${name}`;
    if (WRITE) {
      const row = await prisma.powerPlant.upsert({
        where: { name },
        create: { name, fuel, capacityMw: capacity, organizationId: orgCode ? orgIds[orgCode] : null, sourceDocumentId: sourceId },
        update: { fuel, capacityMw: capacity, organizationId: orgCode ? orgIds[orgCode] : null, sourceDocumentId: sourceId ?? undefined },
        select: { id: true },
      });
      plantId = row.id;
    }
    if (sourceId) {
      await observe({ sourceDocumentId: sourceId, subjectType: 'PowerPlant', subjectId: plantId, metric: 'installed_capacity', value: capacity, unit: 'MW', windowStart, windowEnd });
      await observe({ sourceDocumentId: sourceId, subjectType: 'PowerPlant', subjectId: plantId, metric: 'present_capacity', value: p.presentCapacityMw, unit: 'MW', windowStart, windowEnd });
    }
  }
  if (lostSecondary.length) notes.push(`${lostSecondary.length} dual-fuel plants keep their primary fuel only (e.g. ${lostSecondary.slice(0, 3).join('; ')})`);

  // Node links — the four diagram nodes that are organisations.
  const nodes = await prisma.node.findMany({ select: { id: true, label: true } });
  const linkFor = (label: string) =>
    /^BPDB$/i.test(label) ? 'BPDB' : /^PGCB$/i.test(label) ? 'PGCB' : /regulatory/i.test(label) ? 'BERC' : /ministry/i.test(label) ? 'MPEMR' : null;
  for (const n of nodes) {
    const code = linkFor(n.label);
    if (!code) continue;
    bump('nodeLinks');
    if (WRITE) await prisma.node.update({ where: { id: n.id }, data: { entityType: 'Organization', entityId: orgIds[code] } });
  }
}

async function main() {
  await backfillGas();
  await backfillGrid();
  console.log(WRITE ? 'Applied:' : 'Dry run — would write:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(24)} ${v}`);
  if (notes.length) { console.log('\nNotes:'); for (const n of notes) console.log('  - ' + n); }
  if (refused.length) { console.log(`\nRefused (${refused.length}):`); for (const r of refused) console.log('  - ' + r); }
  if (!WRITE) console.log('\nPass --write to apply.');
}

main()
  .catch((e) => { console.error(e instanceof Error ? e.stack : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
