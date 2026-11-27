import fs from 'node:fs';
import { requiredTgmMonths, verifyMonthlyViewer } from './month-end-dependencies.mjs';

const [viewer, checkpointFile] = process.argv.slice(2);
if (!viewer || !checkpointFile) throw Error('Usage: npm run flow:verify-viewer -- <combined-viewer.html> <private-checkpoint.json>');
const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
const months = requiredTgmMonths(checkpoint.periodStart, checkpoint.periodEnd, checkpoint.requiredTgmMonths || []);
console.log(JSON.stringify({ requiredTgmMonths: months,
  ...verifyMonthlyViewer(fs.readFileSync(viewer, 'utf8'), months, checkpoint.monthlyReports) }, null, 2));
