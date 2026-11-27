import { createHash } from 'node:crypto';

const day = 86400000;
function calendarDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.valueOf())
      || date.toISOString().slice(0, 10) !== value) throw Error('Invalid reporting date');
  return date;
}

export function monthEndsInWeek(periodStart, periodEnd) {
  const start = calendarDate(periodStart), end = calendarDate(periodEnd);
  if (end - start !== 6 * day) throw Error('Expected a complete seven-day reporting period');
  const months = [];
  for (let d = start; d <= end; d = new Date(d.valueOf() + day)) {
    if (new Date(d.valueOf() + day).getUTCDate() === 1) months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export function requiredTgmMonths(periodStart, periodEnd, carriedMonths = [], previousPeriodEnd) {
  if (!Array.isArray(carriedMonths) || carriedMonths.some(m => !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(m)
      || m > periodEnd.slice(0, 7))) throw Error('Invalid carried TGM month');
  // Keep previous requirements until incorporated; a new week must not erase an
  // unresolved month-end dependency. Already completed HTML can be reused.
  const months = [...carriedMonths, ...monthEndsInWeek(periodStart, periodEnd)];
  if (previousPeriodEnd) {
    const previous = calendarDate(previousPeriodEnd), end = calendarDate(periodEnd);
    if (previous > end) throw Error('Checkpoint is later than the reporting period');
    // A holiday or interrupted Monday must not lose the intervening month end.
    for (let d = new Date(previous.valueOf() + day); d <= end; d = new Date(d.valueOf() + day)) {
      if (new Date(d.valueOf() + day).getUTCDate() === 1) months.push(d.toISOString().slice(0, 7));
    }
  }
  return [...new Set(months)].sort();
}

export function monthlyDependenciesComplete(months, checkpoint) {
  return months.every(month => {
    const record = checkpoint.monthlyReports?.[month];
    return record?.verified === true && record.financeSynced === true
      && /^[a-f0-9]{64}$/.test(record.reportSha256 || '')
      && /^[a-f0-9]{64}$/.test(record.workbookSha256 || '')
      && record.viewerSha256 === checkpoint.sha256;
  });
}

export function verifyMonthlyViewer(source, months, records = {}) {
  if (!Array.isArray(months) || months.some(m => !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(m))) throw Error('Invalid required TGM months');
  const catalogText = /^\s*const catalog = ([^\n]+);\s*$/m.exec(source)?.[1];
  if (!catalogText) throw Error('Combined viewer catalog not found');
  const catalog = JSON.parse(catalogText);
  const companies = catalog.filter(c => c.id === 'tgm');
  if (companies.length !== 1 || !Array.isArray(companies[0].reports)) throw Error('Expected one TGM report catalog');
  const viewerSha256 = createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
  const verified = {};
  for (const month of months) {
    const record = records[month], id = `tgm-${month.replace('-', '')}`;
    const reports = companies[0].reports.filter(r => r.id === id);
    if (reports.length !== 1 || typeof reports[0].html !== 'string') throw Error(`Missing or duplicate TGM report: ${month}`);
    if (record?.verified !== true || record.financeSynced !== true
        || !/^[a-f0-9]{64}$/.test(record.workbookSha256 || '')) throw Error(`TGM workbook/source verification incomplete: ${month}`);
    const html = reports[0].html;
    const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '';
    const [year, number] = month.split('-');
    const name = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(`${year}-${number}-01T00:00:00Z`));
    if (!/monthly payment report/i.test(title) || !new RegExp(`${name}\\s+${year}`, 'i').test(title)
        || !/TOP GUINEA MINING SARL/i.test(html)) throw Error(`TGM report identity/period mismatch: ${month}`);
    const sha = createHash('sha256').update(html.replace(/\r\n/g, '\n')).digest('hex');
    if (sha !== record.reportSha256) throw Error(`TGM HTML differs from verified Finance report: ${month}`);
    verified[month] = { ...record, viewerSha256 };
  }
  return { viewerSha256, monthlyReports: verified };
}
