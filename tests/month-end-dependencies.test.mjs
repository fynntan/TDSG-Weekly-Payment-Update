import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { monthEndsInWeek, requiredTgmMonths, verifyMonthlyViewer } from '../scripts/month-end-dependencies.mjs';
import { weeklyRunPlan } from '../scripts/weekly-run-plan.mjs';

test('month-end includes either boundary, leap February and December across years', () => {
  assert.deepEqual(monthEndsInWeek('2026-11-30', '2026-12-06'), ['2026-11']);
  assert.deepEqual(monthEndsInWeek('2026-11-02', '2026-11-08'), []);
  assert.deepEqual(monthEndsInWeek('2026-08-24', '2026-08-30'), []);
  assert.deepEqual(monthEndsInWeek('2026-08-31', '2026-09-06'), ['2026-08']);
  assert.deepEqual(monthEndsInWeek('2026-12-28', '2027-01-03'), ['2026-12']);
  assert.deepEqual(monthEndsInWeek('2028-02-28', '2028-03-05'), ['2028-02']);
  assert.deepEqual(monthEndsInWeek('2026-10-26', '2026-11-01'), ['2026-10']);
  assert.deepEqual(monthEndsInWeek('2026-11-23', '2026-11-29'), []);
  assert.deepEqual(requiredTgmMonths('2026-12-07', '2026-12-13', ['2026-11']), ['2026-11']);
  assert.deepEqual(requiredTgmMonths('2026-12-07', '2026-12-13', [], '2026-11-29'), ['2026-11']);
  assert.throws(() => monthEndsInWeek('2026-02-30', '2026-03-08'), /Invalid/);
});

const html = '<title>TGM Monthly Payment Report - November 2026</title><h1>TOP GUINEA MINING SARL</h1>';
const reportSha256 = createHash('sha256').update(html).digest('hex');
const source = `const catalog = ${JSON.stringify([{id:'tdsg',reports:[]},{id:'tgm',reports:[{id:'tgm-202611',html}]}])};`;
const record = { verified:true, financeSynced:true, reportSha256, workbookSha256:'b'.repeat(64) };
test('combined viewer must contain the exact verified monthly HTML and workbook evidence', () => {
  assert.equal(verifyMonthlyViewer(source, ['2026-11'], {'2026-11':record}).monthlyReports['2026-11'].reportSha256, reportSha256);
  assert.throws(() => verifyMonthlyViewer(source, ['2026-10'], {'2026-10':record}), /Missing/);
  assert.throws(() => verifyMonthlyViewer(source, ['2026-11'], {'2026-11':{...record,reportSha256:'a'.repeat(64)}}), /differs/);
  assert.throws(() => verifyMonthlyViewer(source, ['2026-11'], {'2026-11':{...record,financeSynced:false}}), /incomplete/);
  assert.throws(() => verifyMonthlyViewer(source.replace('202611','202610'), ['2026-10'], {'2026-10':record}), /identity/);
});

test('noon recovery cannot call a month-end week complete with only the TDSG report', () => {
  const calendar={year:2026,holidays:[],source:'https://www.mom.gov.sg/newsroom/press-releases/2025/0616-public-holidays-for-2026'};
  const cp={periodStart:'2026-11-30',periodEnd:'2026-12-06',result:'report',verified:true,financeSynced:true,
    url:'https://venus.milolab.io/example-token/',sha256:'a'.repeat(64),version:'v1',
    deliveries:{venus:{status:'sent',version:'v1',receiptPath:'private/a'},fynn:{status:'sent',version:'v1',receiptPath:'private/b'}}};
  const plan=checkpoint=>weeklyRunPlan({now:'2026-12-07T04:00:00Z',calendar,checkpoint});
  assert.equal(plan(cp).action,'resume_incomplete');
  assert.deepEqual(plan(cp).requiredTgmMonths,['2026-11']);
  assert.equal(plan({...cp,monthlyReports:{'2026-11':{...record,viewerSha256:cp.sha256}}}).action,'already_completed');
  assert.equal(plan({...cp,monthlyReports:{'2026-11':{...record,viewerSha256:'c'.repeat(64)}}}).action,'resume_incomplete');
});
