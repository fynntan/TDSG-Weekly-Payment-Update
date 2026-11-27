import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { singaporeDate } from './payment-policy.mjs';
import { isoWeekNumber } from './report-period.mjs';

export function weeklyRunPlan({ now = new Date().toISOString(), calendar, checkpoint = {} }) {
  const date = singaporeDate(now);
  const local = new Date(`${date}T00:00:00Z`);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', hour: '2-digit', hourCycle: 'h23' }).format(new Date(now)));
  if (local.getUTCDay() !== 1 || ![11, 12].includes(hour)) return { action: 'not_due' };
  // Unknown calendar is a blocker, never silently treated as a working day.
  if (calendar?.year !== local.getUTCFullYear() || !Array.isArray(calendar.holidays)
      || !/^https:\/\/(?:www\.)?mom\.gov\.sg\//.test(calendar.source || '')) {
    return { action: 'calendar_required', date };
  }
  if (calendar.holidays.includes(date)) return { action: 'skip_public_holiday', date };
  const end = new Date(local); end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 6);
  const periodEnd = end.toISOString().slice(0, 10), periodStart = start.toISOString().slice(0, 10);
  const context = { date, phase: hour === 11 ? 'primary' : 'recovery', periodStart, periodEnd, week: isoWeekNumber(end) };
  const current = checkpoint.periodEnd === periodEnd;
  // Both routes must have durable, exact-version send evidence. A provider's
  // accepted/sent status is enough for sending, but is not described as delivered.
  const deliveryComplete = ['venus', 'fynn'].every(route => {
    const receipt = checkpoint.deliveries?.[route];
    return ['sent', 'delivered', 'read'].includes(receipt?.status)
      && receipt.version === checkpoint.version && Boolean(receipt.receiptPath);
  });
  if (current && checkpoint.result === 'report' && checkpoint.verified === true
      && checkpoint.financeSynced === true && /^https:\/\/venus\.milolab\.io\//.test(checkpoint.url || '')
      && /^[a-f0-9]{64}$/.test(checkpoint.sha256 || '') && checkpoint.version && deliveryComplete) {
    return { ...context, action: 'already_completed' };
  }
  if (current && checkpoint.leaseUntil && Date.parse(checkpoint.leaseUntil) > Date.parse(now)) {
    return { ...context, action: 'run_in_progress' };
  }
  return { ...context, action: current ? 'resume_incomplete' : 'start',
    checkUncertainSendsFirst: true, resendUnchangedMissingNotice: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const privateRoot = path.join(root, 'output', 'weekly-flow');
  const read = name => {
    const file = path.join(privateRoot, name);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
  };
  console.log(JSON.stringify(weeklyRunPlan({ calendar: read('singapore-calendar.json'), checkpoint: read('checkpoint.json') }), null, 2));
}
