import { isoWeekNumber } from './report-period.mjs';

export const reportAttribution = 'Prepared by Fynn Tan · Reviewed by Venus Tham';

export function singaporeDate(timestamp) {
  // Require an offset; host timezone must never decide the reporting week.
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(String(timestamp))) throw Error('Timestamp requires an explicit timezone');
  const date = new Date(timestamp);
  if (!Number.isFinite(date.valueOf())) throw Error('Invalid timestamp');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function rougeRecognition({ signed, stamped, confirmationTimestamp, completionDate, duplicateCostsResolved }) {
  if (signed !== true || stamped !== true) return { status: 'awaiting_signed_stamped_support' };
  if (duplicateCostsResolved !== true) return { status: 'reconcile_duplicate_costs' };
  // Same convention as PRFs 365/366 in Week 45. This is a reporting date,
  // not a claim that a TDSG bank account was debited on that date.
  const date = completionDate || singaporeDate(confirmationTimestamp);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw Error('Invalid completion date');
  }
  return { status: 'recognized', date, week: isoWeekNumber(new Date(`${date}T00:00:00Z`)),
    basis: completionDate ? 'documented_completion' : 'signed_stamped_confirmation' };
}

export function hasReportAttribution(source) {
  const meta = /<div\b[^>]*class=["']meta["'][^>]*>([\s\S]*?)<\/div>/i.exec(source)?.[1] || '';
  return meta.replace(/<[^>]*>/g, '').replace(/&middot;|&#183;/g, '·').replace(/\s+/g, ' ').trim() === reportAttribution;
}
