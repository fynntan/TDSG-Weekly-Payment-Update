#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function line(value, label) {
  if (typeof value !== 'string' || !value.trim() || /[\r\n\x00-\x1f*]/.test(value)) {
    throw new Error(`${label} must be one non-empty line without formatting characters.`);
  }
  return value.trim();
}

// Callers supply verified facts in plain English. Never rewrite reference codes,
// currencies, names or amounts automatically to change their capitalization.
export function formatNotification({ title, url, groups, kind, existingMessage }, limit = 3500) {
  if (kind === 'storage' || kind === 'usage') {
    if (typeof existingMessage !== 'string' || !existingMessage.trim()) throw new Error('Alert text is required.');
    return [existingMessage];
  }
  if (!Number.isInteger(limit) || limit < 250 || limit > 3500) throw new Error('Invalid message limit.');
  title = line(title, 'Title');
  const words = title.replace(/\b[A-Z0-9]{1,5}\b/g, '').replace(/[^A-Za-z]/g, '');
  if (words && words === words.toUpperCase()) throw new Error('Use a sentence-case title.');
  if (url !== undefined) {
    url = line(url, 'URL');
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Use an HTTPS URL without credentials.');
  }
  if (!Array.isArray(groups) || !groups.length) throw new Error('At least one notification group is required.');
  const header = `*${title}*${url ? `\n\n${url}` : ''}`;
  // Reserve enough room for numbered parts; each part repeats its URL and heading.
  const budget = limit - header.length - 50;
  const blocks = [];
  for (const group of groups) {
    const company = group.company === undefined ? null : line(group.company, 'Company');
    if (!Array.isArray(group.items) || !group.items.length) throw new Error('Each group needs details.');
    const heading = company ? `*${company}*\n` : '';
    let block = heading;
    for (const item of group.items) {
      const structured = typeof item === 'object' && item !== null && ['supplier', 'description', 'amount'].some(key => key in item);
      const detail = typeof item === 'string' ? line(item, 'Detail') : structured
        ? [line(item.reference, 'Reference'), line(item.supplier, 'Supplier'), line(item.description, 'Description'), line(item.amount, 'Amount with currency')].join(' | ')
        : `${line(item.reference, 'Reference')} | ${line(item.detail, 'Detail')}`;
      const entry = `• ${detail}`;
      if (heading.length + entry.length > budget) throw new Error('An item exceeds the message limit; shorten its description.');
      if (block !== heading && block.length + entry.length + 1 > budget) { blocks.push(block); block = heading; }
      block += `${block === heading ? '' : '\n'}${entry}`;
    }
    blocks.push(block);
  }
  const pages = [];
  let page = '';
  for (const block of blocks) {
    if (page && page.length + block.length + 2 > budget) { pages.push(page); page = ''; }
    page += `${page ? '\n\n' : ''}${block}`;
  }
  if (page) pages.push(page);
  return pages.map((body, i) => {
    const message = `${header}${pages.length > 1 ? `\n\nPart ${i + 1} of ${pages.length}` : ''}\n\n${body}`;
    if (message.length > limit) throw new Error('Message exceeds the limit.');
    return message;
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/format-whatsapp-notification.mjs private-notification.json');
    console.log(JSON.stringify(formatNotification(JSON.parse(readFileSync(process.argv[2], 'utf8'))), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
