import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsRoot = path.join(repositoryRoot, "reports");
const failures = [];

function reportFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? reportFiles(fullPath)
      : entry.name.toLowerCase().endsWith(".html")
        ? [fullPath]
        : [];
  });
}

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

function plainText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function amount(text) {
  return Number(String(text).replace(/[^\d.-]/g, "")) || 0;
}

function tableSubtotal(source, label) {
  const row = new RegExp(
    `<tr\\s+class=["']tot["'][^>]*>([\\s\\S]*?${label}[\\s\\S]*?)<\\/tr>`,
    "i",
  ).exec(source);
  if (!row) return null;
  const cells = Array.from(row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi));
  const numericValues = cells
    .slice(1)
    .map((cell) => plainText(cell[1]))
    .filter((value) => /\d/.test(value));
  return numericValues.length ? amount(numericValues[numericValues.length - 1]) : null;
}

function summaryAmount(source, className) {
  const row = new RegExp(
    `<div\\s+class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
    "i",
  ).exec(source);
  const value = row && /class=["']amt["'][^>]*>([\s\S]*?)<\/[^>]+>/i.exec(row[1]);
  return value ? amount(plainText(value[1])) : null;
}

if (!fs.existsSync(reportsRoot)) {
  console.error("No reports directory found.");
  process.exit(1);
}

const files = reportFiles(reportsRoot);

if (files.length === 0) {
  console.error("No HTML reports found.");
  process.exit(1);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const name = path.relative(repositoryRoot, file);
  const requiresPaymentMode = !/[\\/]2026-07[\\/]/.test(name);
  const checks = [
    [count(source, /<style\b/gi) === 1, "must contain exactly one stylesheet"],
    [count(source, /<script\b/gi) === 1, "must contain exactly one script"],
    [/Content-Security-Policy/i.test(source), "must include a Content Security Policy"],
    [/src=["']data:image\/png;base64,/i.test(source), "must embed the logo"],
    [/TOP DEVELOPMENT SERVICES GUINEA SARLU/.test(source), "must show the full company name"],
    [!/<nav\b/i.test(source), "must not include report navigation"],
    [!/<link\b[^>]*href=/i.test(source), "must not load external styles or fonts"],
    [!/<th[^>]*>\s*Remarks\s*<\/th>/i.test(source), "must use Ex. rate, not Remarks"],
    [/<th[^>]*>\s*Ex\. rate\s*<\/th>/i.test(source), "must include the Ex. rate header"],
    [!requiresPaymentMode || /<th[^>]*>\s*Payment Mode\s*<\/th>/i.test(source), "must include the Payment Mode header"],
    [
      !requiresPaymentMode || /Payment Date\s*<\/th>\s*<th[^>]*>\s*Payment Mode\s*<\/th>\s*<th[^>]*>\s*Payee \/ Supplier/i.test(source),
      "must place Payment Mode between Payment Date and Payee / Supplier",
    ],
    [!requiresPaymentMode || !/<b>\s*Petty Cash\b/i.test(source), "must not repeat Petty Cash in Payee / Supplier"],
    [/\.sort\(/.test(source), "must retain descending sorting"],
    [/overflow-x:\s*auto/.test(source), "must retain mobile table scrolling"],
  ];

  checks.forEach(([passed, message]) => {
    if (!passed) failures.push(`${name}: ${message}`);
  });

  const modes = Array.from(
    source.matchAll(/<tr>([\s\S]*?)<\/tr>/gi),
    (match) => Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
  )
    .filter((cells) => cells.length === 10)
    .map((cells) => plainText(cells[3][1]));
  if (
    requiresPaymentMode &&
    modes.some(
      (mode) =>
        !["OCBC", "Ecobank", "Rouge POB"].includes(mode) &&
        !/^Petty Cash - \S.+/.test(mode),
    )
  ) {
    failures.push(`${name}: payment mode must identify OCBC, Ecobank, Rouge POB, or the petty-cash custodian`);
  }

  const tdsgSummary = summaryAmount(source, "summary-total");
  const rougeSummary = summaryAmount(source, "rouge-total");
  const weekTotal = summaryAmount(source, "grand");
  const tdsgSubtotal = tableSubtotal(source, "TDSG subtotal");
  const rougeSubtotal = tableSubtotal(source, "Rouge POB subtotal");

  if (tdsgSummary === null || tdsgSummary !== tdsgSubtotal) {
    failures.push(`${name}: TDSG summary does not match its table subtotal`);
  }
  if (rougeSummary === null || rougeSummary !== rougeSubtotal) {
    failures.push(`${name}: Rouge summary does not match its table subtotal`);
  }
  if (weekTotal === null || weekTotal !== tdsgSummary + rougeSummary) {
    failures.push(`${name}: week total does not equal TDSG plus Rouge`);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exit(1);
}

console.log(`Verified ${files.length} report(s).`);
