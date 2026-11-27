import test from 'node:test';
import assert from 'node:assert/strict';
import { hasReportAttribution, rougeRecognition, singaporeDate } from '../scripts/payment-policy.mjs';
import { weeklyRunPlan } from '../scripts/weekly-run-plan.mjs';

test('Rouge uses signed/stamped confirmation across the Singapore midnight boundary', () => {
  const input = { signed: true, stamped: true, confirmationTimestamp: '2026-11-26T16:07:29Z', duplicateCostsResolved: true };
  assert.deepEqual(rougeRecognition(input), { status: 'recognized', date: '2026-11-27', week: 48, basis: 'signed_stamped_confirmation' });
  assert.equal(rougeRecognition({ ...input, signed: false }).status, 'awaiting_signed_stamped_support');
  assert.equal(rougeRecognition({ ...input, duplicateCostsResolved: false }).status, 'reconcile_duplicate_costs');
  assert.equal(rougeRecognition({ ...input, completionDate: '2026-11-20' }).week, 47);
  assert.throws(() => singaporeDate('2026-11-27T00:07:29'), /timezone/);
});

test('Week 45 precedent uses the confirmation date rather than the old invoice date', () => {
  assert.equal(rougeRecognition({ signed: true, stamped: true, confirmationTimestamp: '2026-11-06T10:55:33Z', duplicateCostsResolved: true }).week, 45);
});

test('draft attribution cannot pass the final report gate', () => {
  assert.equal(hasReportAttribution('<div class="meta">Prepared by <b>Fynn Tan</b> &middot; Reviewed by <b>Venus Tham</b></div>'), true);
  assert.equal(hasReportAttribution('<div class="meta">Prepared for review</div>'), false);
});

const calendar = { year: 2026, holidays: ['2026-11-09'], source: 'https://www.mom.gov.sg/newsroom/press-releases/2025/0616-public-holidays-for-2026' };
const plan = (now, checkpoint = {}, cal = calendar) => weeklyRunPlan({ now, checkpoint, calendar: cal });
test('Monday primary and one-hour recovery share the previous ISO week', () => {
  const primary = plan('2026-11-30T03:00:42Z'), recovery = plan('2026-11-30T04:00:42Z');
  assert.equal(primary.phase, 'primary'); assert.equal(recovery.phase, 'recovery');
  assert.equal(primary.periodEnd, '2026-11-29'); assert.equal(recovery.periodStart, '2026-11-23');
  assert.equal(primary.week, 48);
  assert.equal(plan('2026-12-01T03:00:00Z').action, 'not_due');
  assert.equal(plan('2026-11-30T02:59:00Z').action, 'not_due');
  assert.equal(plan('2026-11-09T04:00:00Z').action, 'skip_public_holiday');
  assert.equal(plan('2026-11-30T03:00:00Z', {}, { year: 2025 }).action, 'calendar_required');
});

test('recovery skips a verified completion but resumes missing or uncertain route evidence', () => {
  const checkpoint = { periodEnd: '2026-11-29', result: 'report', verified: true, financeSynced: true,
    url: 'https://venus.milolab.io/example-token/', sha256: 'a'.repeat(64), version: 'v1',
    deliveries: { venus: { status: 'sent', version: 'v1', receiptPath: 'private/a.json' },
      fynn: { status: 'delivered', version: 'v1', receiptPath: 'private/b.json' } } };
  assert.equal(plan('2026-11-30T04:00:00Z', checkpoint).action, 'already_completed');
  const uncertain = structuredClone(checkpoint); uncertain.deliveries.fynn.status = 'uncertain';
  assert.equal(plan('2026-11-30T04:00:00Z', uncertain).action, 'resume_incomplete');
  const oldReceipt = structuredClone(checkpoint); oldReceipt.deliveries.fynn.version = 'v0';
  assert.equal(plan('2026-11-30T04:00:00Z', oldReceipt).action, 'resume_incomplete');
  assert.equal(plan('2026-11-30T04:00:00Z', { ...checkpoint, result: 'missing' }).action, 'resume_incomplete');
  assert.equal(plan('2026-11-30T04:00:00Z', { ...uncertain, leaseUntil: '2026-11-30T04:05:00Z' }).action, 'run_in_progress');
});
