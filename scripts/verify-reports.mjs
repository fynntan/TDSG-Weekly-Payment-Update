import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsRoot = path.join(repositoryRoot, "reports");
const failures = [];
const expectedStylesheet = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.css"), "utf8")
  .replace(/\r\n/g, "\n")
  .trim();
const expectedBehavior = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.js"), "utf8")
  .replace(/\r\n/g, "\n")
  .trim();

function embeddedAsset(source, tagName) {
  const match = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i")
    .exec(source);
  if (!match) return null;

  const lines = match[1].replace(/^\r?\n|\r?\n\s*$/g, "").split(/\r?\n/);
  const nonEmptyLines = lines.filter((line) => line.trim());
  const indent = nonEmptyLines.length
    ? Math.min(...nonEmptyLines.map((line) => line.match(/^\s*/)[0].length))
    : 0;
  return lines.map((line) => line.slice(Math.min(indent, line.length))).join("\n").trim();
}

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

function detailTablesAreUsdDescending(source) {
  return Array.from(source.matchAll(/<tbody>([\s\S]*?)<\/tbody>/gi)).every(
    (tbody) => {
      const usdValues = Array.from(
        tbody[1].matchAll(/<tr(?![^>]*class=["'][^"']*tot)(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi),
        (row) => Array.from(row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
      )
        .filter((cells) => cells.length === 10)
        .map((cells) => amount(plainText(cells[8][1])));
      return usdValues.every((value, index) => index === 0 || usdValues[index - 1] >= value);
    },
  );
}

function originalAmountSubtotalsAreBlank(source) {
  return Array.from(source.matchAll(/<tr\s+class=["']tot["'][^>]*>([\s\S]*?)<\/tr>/gi)).every(
    (row) => {
      const cells = Array.from(row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi));
      return cells.length < 3 || plainText(cells[1][1]) === "";
    },
  );
}

function detailHeadersMatch(source, requiresPaymentMode) {
  const expected = requiresPaymentMode
    ? [
        "No", "PRF No", "Payment Date", "Payment Mode", "Payee / Supplier",
        "Purpose", "Category", "Original Amount", "USD", "Ex. Rate",
      ]
    : [
        "No", "PRF No", "Payment Date", "Payee / Supplier", "Purpose",
        "Category", "Original Amount", "USD", "Ex. Rate",
      ];
  const headerRows = Array.from(source.matchAll(/<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/gi));
  return headerRows.length > 0 && headerRows.every((row) => {
    const actual = Array.from(
      row[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi),
      (cell) => plainText(cell[1]),
    );
    return actual.length === expected.length &&
      actual.every((label, index) => label === expected[index]);
  });
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
  const embeddedStylesheet = embeddedAsset(source, "style");
  const embeddedBehavior = embeddedAsset(source, "script");
  const checks = [
    [count(source, /<style\b/gi) === 1, "must contain exactly one stylesheet"],
    [count(source, /<script\b/gi) === 1, "must contain exactly one script"],
    [embeddedStylesheet === expectedStylesheet, "embedded stylesheet must match templates/report.css; regenerate the report"],
    [embeddedBehavior === expectedBehavior, "embedded behavior must match templates/report.js; regenerate the report"],
    [/Content-Security-Policy/i.test(source), "must include a Content Security Policy"],
    [/src=["']data:image\/png;base64,/i.test(source), "must embed the logo"],
    [/TOP DEVELOPMENT SERVICES GUINEA SARLU/.test(source), "must show the full company name"],
    [!/<nav\b/i.test(source), "must not include report navigation"],
    [!/<link\b[^>]*href=/i.test(source), "must not load external styles or fonts"],
    [!/<th[^>]*>\s*Remarks\s*<\/th>/i.test(source), "must use Ex. Rate, not Remarks"],
    [/<th[^>]*>\s*Ex\. Rate\s*<\/th>/.test(source), "must include the exact Ex. Rate header"],
    [/<th[^>]*>\s*Original Amount\s*<\/th>/.test(source), "must include the Original Amount header"],
    [!/<th[^>]*>\s*Original Currency\s*<\/th>/.test(source), "must use Original Amount, not Original Currency"],
    [!/<th[^>]*>\s*GNF\s*<\/th>/.test(source), "must not label mixed original-currency values as GNF"],
    [originalAmountSubtotalsAreBlank(source), "must not total Original Amount"],
    [detailHeadersMatch(source, requiresPaymentMode), "detail table headers must use the approved labels and order"],
    [/<th>\s*Original Amount\s*<\/th>/.test(source), "Original Amount header must follow the left-aligned text headers"],
    [!/<th\b[^>]*class=["'][^"']*num[^"']*["'][^>]*>/i.test(source), "all table headers must be left-aligned"],
    [/font-variant-numeric:\s*tabular-nums/.test(source), "numeric values must retain decimal-position alignment"],
    [/td:nth-child\(8\)[\s\S]*td:nth-child\(9\)[\s\S]*text-align:\s*right/.test(source), "Original Amount and USD columns must be explicitly right-aligned"],
    [/GNF payments are converted to USD using the BCRG rate applicable on each payment date\./.test(source), "footer must state the GNF conversion basis"],
    [!/Original-currency amounts are shown in the detail table/.test(source), "footer must remain concise"],
    [!/USD payments retain their original amount/.test(source), "footer must remain concise"],
    [!/USD\/EUR payments carry no GNF\/rate/.test(source), "footer must not retain the obsolete GNF/rate wording"],
    [!requiresPaymentMode || /<th[^>]*>\s*Payment Mode\s*<\/th>/i.test(source), "must include the Payment Mode header"],
    [
      !requiresPaymentMode || /Payment Date\s*<\/th>\s*<th[^>]*>\s*Payment Mode\s*<\/th>\s*<th[^>]*>\s*Payee \/ Supplier/i.test(source),
      "must place Payment Mode between Payment Date and Payee / Supplier",
    ],
    [!requiresPaymentMode || !/<b>\s*Petty Cash\b/i.test(source), "must not repeat Petty Cash in Payee / Supplier"],
    [
      !/TDSG-2026-08-283/.test(source) ||
        /Conakry Terminal \/ West Africa Container Agency - Guinea/.test(source),
      "PRF 283 must identify its actual logistics suppliers",
    ],
    [/\.sort\(/.test(source), "must retain descending sorting"],
    [!requiresPaymentMode || detailTablesAreUsdDescending(source), "detail tables must be stored in descending USD order"],
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

  const originalAmountCells = Array.from(
    source.matchAll(/<tr>([\s\S]*?)<\/tr>/gi),
    (match) => Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
  )
    .filter((cells) => cells.length === 9 || cells.length === 10)
    .map((cells) => plainText(cells[cells.length - 3][1]));
  if (originalAmountCells.some((value) => !/^(?:GNF|USD|EUR)\s+[\d,.]+(?:\s+\+\s+(?:GNF|USD|EUR)\s+[\d,.]+)?$/.test(value))) {
    failures.push(`${name}: every detail row must show its original currency code and amount`);
  }
  if (!/<td\b[^>]*class=["'][^"']*num[^"']*["'][^>]*>\s*(?:GNF|USD|EUR)\s+[\d,.]+\s*<\/td>/.test(source)) {
    failures.push(`${name}: Original Amount values must remain right-aligned`);
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
