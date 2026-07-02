import dotenv from 'dotenv';
import * as path from 'path';

import { runIngestionPipeline } from '../lib/cron/energy-ingest';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (require.main === module) {
  runIngestionPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runIngestionPipeline };