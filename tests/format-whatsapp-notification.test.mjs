import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNotification } from '../scripts/format-whatsapp-notification.mjs';
const base = { title: 'Payment review update', url: 'https://example.com/review', groups: [{ company: 'TDSG', items: [{ reference: 'TDSG-2026-11-370', detail: 'Office cash reimbursement — USD 25.' }] }, { company: 'KCP', items: ['Crane purchase.'] }] };
test('bold headings, company spacing and exact financial/reference text', () => {
  assert.equal(formatNotification(base)[0], '*Payment review update*\n\nhttps://example.com/review\n\n*TDSG*\n• TDSG-2026-11-370 | Office cash reimbursement — USD 25.\n\n*KCP*\n• Crane purchase.');
});
test('long groups split with heading, numbering and URL on every part', () => {
  const messages = formatNotification({ ...base, groups: [{ company: 'TDSG', items: Array.from({ length: 30 }, (_, i) => `PRF ${i}: verified source details.`) }] }, 300);
  assert.ok(messages.length > 1);
  for (const message of messages) { assert.ok(message.length <= 300); assert.match(message, /Part \d+ of \d+/); assert.ok(message.includes('*TDSG*')); assert.ok(message.includes(base.url)); assert.doesNotMatch(message, /^• .+\n• /m); }
  assert.deepEqual(messages.flatMap(m => [...m.matchAll(/^• (.+)$/gm)].map(x=>x[1])), Array.from({length:30},(_,i)=>`PRF ${i}: verified source details.`));
});
test('each report bullet is separated by a blank line', () => {
  assert.equal(formatNotification({title:'Weekly payment report',groups:[{company:'TDSG',items:['Week 47: USD 16,430.','A bank statement is still required.','No Rouge payments recognized in this period.']} ]})[0], '*Weekly payment report*\n\n*TDSG*\n• Week 47: USD 16,430.\n\n• A bank statement is still required.\n\n• No Rouge payments recognized in this period.');
});
test('implementation replies and report attribution cannot leak into recipient notices', () => {
  for(const detail of ['Codex updated the report.','Prepared by Fynn Tan · Reviewed by Venus Tham has been restored.','GitHub Actions passed.','13 tests passed.','Restored the report footer.','git push completed.']) {
    assert.throws(()=>formatNotification({...base,groups:[{company:'TDSG',items:[detail]}]}),/recipient-facing/);
  }
  assert.doesNotThrow(()=>formatNotification({...base,groups:[{company:'TDSG',items:['Awaiting BCI statements for 21–22 November.','PRF 372 cleared on 26 November and belongs in the next reporting week.']}]}));
});
test('storage and usage alerts preserve exact text', () => {
  for (const kind of ['storage', 'usage']) assert.deepEqual(formatNotification({kind, existingMessage: 'Original\nalert'}), ['Original\nalert']);
});
test('rejects empty facts, injected headings, insecure URLs and overlong items', () => {
  for (const patch of [{title:'PAYMENT REVIEW UPDATE'}, {title:'Title\n*Injected*'}, {url:'http://example.com'}, {url:'https://user:secret@example.com'}, {groups:[]}, {groups:[{company:'KCP',items:['x'.repeat(4000)]}]}]) assert.throws(() => formatNotification({...base,...patch}));
});


test('PRF entries retain reference, supplier, description and exact currency/amount', () => {
 const notice={...base,groups:[{company:'KCP',items:[{reference:'KCP-2026-11-002',supplier:'Hebei Gansibu',description:'100-tonne crane',amount:'USD 260,000'}]}]};
 assert.match(formatNotification(notice)[0], /KCP-2026-11-002 \| Hebei Gansibu \| 100-tonne crane \| USD 260,000/);
 delete notice.groups[0].items[0].supplier;
 assert.throws(()=>formatNotification(notice), /Supplier/);
 notice.groups[0].items[0].supplier='Supplier not verified';notice.groups[0].items[0].amount='Amount not verified';
 assert.match(formatNotification(notice)[0], /Supplier not verified \| 100-tonne crane \| Amount not verified/);
});
