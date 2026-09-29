import dotenv from 'dotenv';
import path from 'path';
import { createScriptPrismaClient } from '../prisma/client';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check if we want to run against production database using target flag
const runProd = process.argv.includes('--production');
if (runProd) {
  // Use production URL
  const prodUrl = process.env.POSTGRES_URL_NON_POOLING?.trim() || process.env.POSTGRES_URL?.trim();
  if (prodUrl) {
    process.env.DATABASE_URL = prodUrl;
  }
}

async function main() {
  const prisma = createScriptPrismaClient();
  try {
    console.log('Connecting to database...');

    // Update live ticker settings (adding BPC automatic fuel retail prices)
    const tickerValue = [
      { id: 'avg-cost', name: 'Avg Gen Cost', value: 6.62, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'gas-cost', name: 'Gas Gen Cost', value: 3.45, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'coal-cost', name: 'Coal Gen Cost', value: 6.62, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'hfo-cost', name: 'HFO Gen Cost', value: 18.06, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'import-cost', name: 'Import Gen Cost', value: 6.34, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'solar-cost', name: 'Solar Gen Cost', value: 15.77, unit: 'Tk/kWh', change: 0.0, prefix: '' },
      { id: 'diesel-bpc', name: 'Diesel (BPC)', value: 135.00, unit: 'Tk/L', change: 0.0, prefix: '' },
      { id: 'kerosene-bpc', name: 'Kerosene (BPC)', value: 155.00, unit: 'Tk/L', change: 0.0, prefix: '' },
      { id: 'octane-bpc', name: 'Octane (BPC)', value: 165.00, unit: 'Tk/L', change: 0.0, prefix: '' },
      { id: 'petrol-bpc', name: 'Petrol (BPC)', value: 160.00, unit: 'Tk/L', change: 0.0, prefix: '' },
      { id: 'gas-prod', name: 'Total Gas Prod', value: 2647.5, unit: 'MMcfd', change: 0.0, prefix: '' },
      { id: 'renewables-cap', name: 'Renewables Cap', value: 1804.8, unit: 'MW', change: 0.0, prefix: '' },
    ];

    await prisma.siteSetting.upsert({
      where: { key: 'ticker' },
      update: { value: tickerValue },
      create: { key: 'ticker', value: tickerValue },
    });
    console.log('✓ Successfully updated key "ticker" in siteSetting with BPC prices.');

  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
