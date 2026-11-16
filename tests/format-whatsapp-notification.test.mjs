import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNotification } from '../scripts/format-whatsapp-notification.mjs';
const base = { title: 'Payment review update', url: 'https://example.com/review', groups: [{ company: 'TDSG', items: [{ reference: 'TDSG-2026-11-370', detail: 'Office cash reimbursement — USD 25.' }] }, { company: 'KCP', items: ['Crane purchase.'] }] };
test('bold headings, company spacing and exact financial/reference text', () => {
  assert.equal(formatNotification(base)[0], '*Payment review update*\n\nhttps://example.com/review\n\n*TDSG*\n• TDSG-2026-11-370 — Office cash reimbursement — USD 25.\n\n*KCP*\n• Crane purchase.');
});
test('long groups split with heading, numbering and URL on every part', () => {
  const messages = formatNotification({ ...base, groups: [{ company: 'TDSG', items: Array.from({ length: 30 }, (_, i) => `PRF ${i}: verified source details.`) }] }, 300);
  assert.ok(messages.length > 1);
  for (const message of messages) { assert.ok(message.length <= 300); assert.match(message, /Part \d+ of \d+/); assert.ok(message.includes('*TDSG*')); assert.ok(message.includes(base.url)); }
});
test('storage and usage alerts preserve exact text', () => {
  for (const kind of ['storage', 'usage']) assert.deepEqual(formatNotification({kind, existingMessage: 'Original\nalert'}), ['Original\nalert']);
});
test('rejects empty facts, injected headings, insecure URLs and overlong items', () => {
  for (const patch of [{title:'PAYMENT REVIEW UPDATE'}, {title:'Title\n*Injected*'}, {url:'http://example.com'}, {url:'https://user:secret@example.com'}, {groups:[]}, {groups:[{company:'KCP',items:['x'.repeat(4000)]}]}]) assert.throws(() => formatNotification({...base,...patch}));
});
