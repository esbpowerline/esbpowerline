import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { gwhToAvgMw, POWER_UNIT } from '@/lib/data/grid/home-snapshot-core';
import { runSredaIngestion } from '@/lib/data/sreda/ingest-sreda';
import prisma from '@/lib/prisma';

const PGCB_BASE_URL = 'https://www.pgcb.gov.bd';
const PETROBANGLA_BASE_URL = 'https://www.petrobangla.org.bd';

/** Resolved at runtime so Turbopack does not trace scratch/** or public/** into the cron bundle. */
function getDownloadDir(): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'scratch', 'downloads');
  }
  return path.join(os.tmpdir(), 'esb-ingest');
}

function getPythonParserScript(): string {
  return path.join(process.cwd(), 'scripts', 'parse_energy_reports.py');
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getFormattedDate(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function downloadFile(url: string, localPath: string, expectedType: 'xlsx' | 'pdf'): Promise<boolean> {
  console.log(`[Ingest] Downloading: ${url} ...`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[Ingest] Failed download HTTP status: ${response.status}`);
      return false;
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (expectedType === 'pdf') {
      if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
        console.warn('[Ingest] Invalid PDF signature (might be HTML redirect page). Skipping.');
        return false;
      }
    } else if (expectedType === 'xlsx') {
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
        console.warn('[Ingest] Invalid Excel signature (might be HTML redirect page). Skipping.');
        return false;
      }
    }

    fs.writeFileSync(localPath, Buffer.from(buffer));
    console.log(`[Ingest] Download complete: ${localPath}`);
    return true;
  } catch (error) {
    console.error('[Ingest] Download error:', error);
    return false;
  }
}

function parseReportFile(filePath: string): Record<string, unknown> | null {
  const pythonScript = getPythonParserScript();
  try {
    const output = execSync(`python "${pythonScript}" "${filePath}"`, { encoding: 'utf8' });
    const parsed = JSON.parse(output) as Record<string, unknown>;
    return parsed.error ? null : parsed;
  } catch (err) {
    console.error('[Ingest] Error parsing report file:', err);
    return null;
  }
}

async function scrapePetrobanglaPdfUrl(): Promise<string | null> {
  console.log('[Ingest] Scrapes Petrobangla homepage for latest daily gas PDF...');
  try {
    const res = await fetch(PETROBANGLA_BASE_URL);
    if (!res.ok) return null;
    const html = await res.text();

    const pdfRegex = /\/uploads\/[^"'\s>]+\.pdf/gi;
    const matches = html.match(pdfRegex);

    if (matches && matches.length > 0) {
      const reportPdf = matches.find((m) => m.toLowerCase().includes('daily') || m.toLowerCase().includes('report'));
      if (reportPdf) {
        return reportPdf.startsWith('http') ? reportPdf : `${PETROBANGLA_BASE_URL}${reportPdf}`;
      }
    }

    return `${PETROBANGLA_BASE_URL}/uploads/editor/files/Daily_Report.pdf`;
  } catch (error) {
    console.error('[Ingest] Petrobangla scraping failed:', error);
    return null;
  }
}

function tryDesktopFallbacks(): { powerGridData: Record<string, unknown> | null; gasData: Record<string, unknown> | null; activeReportDate: Date | null } {
  if (process.env.NODE_ENV === 'production') {
    return { powerGridData: null, gasData: null, activeReportDate: null };
  }

  const userHome = process.env.USERPROFILE || process.env.HOME;
  if (!userHome) {
    return { powerGridData: null, gasData: null, activeReportDate: null };
  }

  let powerGridData: Record<string, unknown> | null = null;
  let gasData: Record<string, unknown> | null = null;
  let activeReportDate: Date | null = null;

  const pgcbDesktopDir = path.join(userHome, 'Desktop', 'PGCB', 'Daily Reports - D');
  const pbDesktopDir = path.join(userHome, 'Desktop', 'Petrobangla', 'Daily Gas Reports - D');

  if (fs.existsSync(pgcbDesktopDir)) {
    const files = fs.readdirSync(pgcbDesktopDir);
    let latestFile = '';
    let latestDate: Date | null = null;
    for (const f of files) {
      if (!f.endsWith('.xlsx') && !f.endsWith('.xlsm')) continue;
      const match = f.match(/(\d{1,2})[-. ](\d{1,2})[-. ](\d{2,4})/);
      if (match) {
        const dVal = parseInt(match[1]);
        const mVal = parseInt(match[2]);
        let yVal = parseInt(match[3]);
        if (yVal < 50) yVal += 2000;
        else if (yVal < 100) yVal += 1900;
        const dt = new Date(yVal, mVal - 1, dVal);
        if (!latestDate || dt > latestDate) {
          latestDate = dt;
          latestFile = f;
        }
      }
    }

    if (latestFile) {
      const devExcelPath = path.join(pgcbDesktopDir, latestFile);
      console.log(`[Ingest] Falling back to desktop sample Excel: ${devExcelPath}`);
      powerGridData = parseReportFile(devExcelPath);
      activeReportDate = latestDate;
    }
  }

  if (!gasData && fs.existsSync(pbDesktopDir)) {
    const files = fs.readdirSync(pbDesktopDir);
    let latestFile = '';
    for (const f of files) {
      if (!f.endsWith('.pdf')) continue;
      const match = f.match(/(\d{1,2})[-. ](\d{1,2})[-. ](\d{2,4})/);
      if (match) {
        latestFile = f;
        break;
      }
    }

    if (latestFile) {
      const devPdfPath = path.join(pbDesktopDir, latestFile);
      console.log(`[Ingest] Falling back to desktop sample PDF: ${devPdfPath}`);
      gasData = parseReportFile(devPdfPath);
    }
  }

  return { powerGridData, gasData, activeReportDate };
}

/** Cron route only — downloads PGCB/Petrobangla reports, syncs homepage metrics, and runs SREDA ingest. */
export async function runIngestionPipeline() {
  const downloadDir = getDownloadDir();
  ensureDir(downloadDir);
  console.log('[Ingest] Ingestion pipeline started...');

  let powerGridData: Record<string, unknown> | null = null;
  let gasData: Record<string, unknown> | null = null;
  let activeReportDate: Date | null = null;

  for (let i = 0; i < 8; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getFormattedDate(checkDate);
    const pgcbExcelUrl = `${PGCB_BASE_URL}/reports/Daily_Report_${dateStr}.xlsx`;
    const localExcelPath = path.join(downloadDir, `Daily_Report_${dateStr}.xlsx`);

    if (fs.existsSync(localExcelPath)) {
      console.log(`[Ingest] Latest Excel already exists locally: ${localExcelPath}`);
      const parsed = parseReportFile(localExcelPath);
      if (parsed) {
        powerGridData = parsed;
        activeReportDate = checkDate;
        console.log(`[Ingest] Successfully parsed local Excel file for date ${dateStr}.`);
        break;
      }
    }

    console.log(`[Ingest] Checking PGCB Excel report at URL: ${pgcbExcelUrl}`);
    const downloadSuccess = await downloadFile(pgcbExcelUrl, localExcelPath, 'xlsx');
    if (downloadSuccess) {
      const parsed = parseReportFile(localExcelPath);
      if (parsed) {
        powerGridData = parsed;
        activeReportDate = checkDate;
        console.log(`[Ingest] Successfully downloaded and parsed Excel file for date ${dateStr}.`);
        break;
      }
    }
  }

  const petrobanglaPdfUrl = await scrapePetrobanglaPdfUrl();
  if (petrobanglaPdfUrl) {
    const todayStr = getFormattedDate();
    const localPdfPath = path.join(downloadDir, `Petrobangla_${todayStr}.pdf`);

    if (fs.existsSync(localPdfPath)) {
      console.log(`[Ingest] Latest PDF already exists locally: ${localPdfPath}`);
      gasData = parseReportFile(localPdfPath);
    } else {
      const pdfSuccess = await downloadFile(petrobanglaPdfUrl, localPdfPath, 'pdf');
      if (pdfSuccess) {
        gasData = parseReportFile(localPdfPath);
      }
    }
  }

  if (!powerGridData || !gasData) {
    const desktop = tryDesktopFallbacks();
    powerGridData = powerGridData ?? desktop.powerGridData;
    gasData = gasData ?? desktop.gasData;
    activeReportDate = activeReportDate ?? desktop.activeReportDate;
  }

  if (powerGridData || gasData) {
    console.log('[Ingest] Updating energy dashboard state settings in DB...');
    try {
      const dbPayload: Record<string, string> = {};

      if (powerGridData) {
        dbPayload.generation_capacity = '28420';
        dbPayload.current_demand = String(Math.round(Number(powerGridData.eveningPeakGen)));
        dbPayload.generation_cost = String(Number(powerGridData.avgProductionCost).toFixed(3));
        dbPayload.est_fuel_cost = String(Math.round(Number(powerGridData.totalDailyCost) / 10000000));
      }

      if (gasData) {
        dbPayload.gas_supply = String(gasData.totalGasProduction);
      }

      const finalReportDate = activeReportDate || new Date();
      const telemetryDate = new Date(finalReportDate.getTime());
      telemetryDate.setDate(telemetryDate.getDate() - 1);

      const yyyy = telemetryDate.getFullYear();
      const mm = String(telemetryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(telemetryDate.getDate()).padStart(2, '0');
      dbPayload.snapshotDate = `${yyyy}-${mm}-${dd}`;

      for (const [key, value] of Object.entries(dbPayload)) {
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        });
      }

      const snapshotSetting = await prisma.siteSetting.findUnique({ where: { key: 'snapshot' } });
      if (snapshotSetting) {
        let snapshot = snapshotSetting.value;
        if (typeof snapshot === 'string') {
          try {
            snapshot = JSON.parse(snapshot);
          } catch {
            /* keep raw */
          }
        }
        if (Array.isArray(snapshot)) {
          for (const item of snapshot as Array<Record<string, unknown>>) {
            if (!powerGridData) continue;
            if (item.label === 'Current Demand') {
              item.value = Math.round(Number(powerGridData.eveningPeakDemand ?? powerGridData.eveningPeakGen));
            } else if (item.label === 'Peak Generation') {
              const dayGen = Number(powerGridData.dayPeakGen ?? 0);
              const eveGen = Number(powerGridData.eveningPeakGen ?? 0);
              item.value = Math.round(Math.max(dayGen, eveGen));
            } else if (item.label === 'Peak Today') {
              const dayPeak = Number(powerGridData.dayPeakDemand ?? 0);
              const evePeak = Number(powerGridData.eveningPeakDemand ?? 0);
              item.value = Math.round(Math.max(dayPeak, evePeak));
            } else if (item.label === 'Daily Generation' && powerGridData.totalEnergyGen != null) {
              item.value = gwhToAvgMw(Number(powerGridData.totalEnergyGen));
              item.unit = POWER_UNIT;
            } else if (item.label === 'Energy Unserved' && powerGridData.totalEnergyUnserved != null) {
              item.value = gwhToAvgMw(Number(powerGridData.totalEnergyUnserved));
              item.unit = POWER_UNIT;
            } else if (item.label === 'Fuel Cost' && powerGridData.avgProductionCost != null) {
              item.value = parseFloat(Number(powerGridData.avgProductionCost).toFixed(2));
            } else if (item.label === 'Gas Supply' && gasData) {
              item.value = Math.round(Number(gasData.totalGasProduction));
            } else if (item.label === 'Coal Generation' && (powerGridData.fuels as Record<string, { generation?: number }> | undefined)?.coal) {
              item.value = gwhToAvgMw(Number((powerGridData.fuels as Record<string, { generation?: number }>).coal.generation ?? 0));
              item.unit = POWER_UNIT;
            } else if (item.label === 'Grid Import' && powerGridData.importPeakMw != null) {
              item.value = Math.round(Number(powerGridData.importPeakMw));
            } else if (item.label === 'Load Shedding') {
              item.value = 0;
            }
          }
          await prisma.siteSetting.update({
            where: { key: 'snapshot' },
            data: { value: snapshot },
          });
          console.log('[Ingest] Live homepage snapshot metrics synced.');
        }
      }

      const tickerSetting = await prisma.siteSetting.findUnique({ where: { key: 'ticker' } });
      if (tickerSetting) {
        let ticker = tickerSetting.value;
        if (typeof ticker === 'string') {
          try {
            ticker = JSON.parse(ticker);
          } catch {
            /* keep raw */
          }
        }
        if (Array.isArray(ticker)) {
          const fuels = powerGridData?.fuels as Record<string, { cost?: number; generation?: number }> | undefined;
          for (const item of ticker as Array<Record<string, unknown>>) {
            if (!powerGridData) continue;
            if (item.id === 'avg-cost') {
              item.value = parseFloat(Number(powerGridData.avgProductionCost).toFixed(2));
            } else if (item.id === 'gas-cost' && fuels?.gas) {
              const val = Number(fuels.gas.cost) / (Number(fuels.gas.generation) * 1000000);
              item.value = parseFloat(val.toFixed(2));
            } else if (item.id === 'coal-cost' && fuels?.coal) {
              const val = Number(fuels.coal.cost) / (Number(fuels.coal.generation) * 1000000);
              item.value = parseFloat(val.toFixed(2));
            } else if (item.id === 'hfo-cost' && fuels?.hfo) {
              const val = Number(fuels.hfo.cost) / (Number(fuels.hfo.generation) * 1000000);
              item.value = parseFloat(val.toFixed(2));
            } else if (item.id === 'import-cost' && fuels?.import) {
              const val = Number(fuels.import.cost) / (Number(fuels.import.generation) * 1000000);
              item.value = parseFloat(val.toFixed(2));
            } else if (item.id === 'solar-cost' && fuels?.solar) {
              const val = Number(fuels.solar.cost) / (Number(fuels.solar.generation) * 1000000);
              item.value = parseFloat(val.toFixed(2));
            } else if (item.id === 'gas-prod' && gasData) {
              item.value = parseFloat(Number(gasData.totalGasProduction).toFixed(1));
            }
          }
          await prisma.siteSetting.update({
            where: { key: 'ticker' },
            data: { value: ticker },
          });
          console.log('[Ingest] Market pricing ticker synced.');
        }
      }

      console.log('[Ingest] Database settings sync complete.');
    } catch (dbError) {
      console.error('[Ingest] DB update failed:', dbError);
    }
  }

  try {
    const sredaResult = await runSredaIngestion();
    if (!sredaResult.ok) {
      console.warn(`[Ingest] SREDA ingest skipped: ${sredaResult.error ?? 'unknown error'}`);
    }
  } catch (sredaError) {
    console.error('[Ingest] SREDA ingest failed:', sredaError);
  }

  console.log('[Ingest] Pipeline iteration complete.');
}