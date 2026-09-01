import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { filenameWeek, isoWeekNumber, reportIsoWeek } from "./report-period.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsRoot = path.join(repositoryRoot, "reports");
const failures = [];
for (const [date, expectedWeek] of [
  [new Date(Date.UTC(2026, 7, 30)), 35],
  [new Date(Date.UTC(2026, 8, 6)), 36],
  [new Date(Date.UTC(2026, 8, 13)), 37],
]) {
  if (isoWeekNumber(date) !== expectedWeek) {
    failures.push(`ISO week calculation failed for ${date.toISOString().slice(0, 10)}; expected Week ${expectedWeek}`);
  }
}
const expectedStylesheet = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.css"), "utf8")
  .replace(/\r\n/g, "\n")
  .trim();
const expectedBehavior = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.js"), "utf8")
  .replace(/\r\n/g, "\n")
  .trim();
const migrationSource = fs.readFileSync(
  path.join(repositoryRoot, "scripts", "migrate-legacy-report.mjs"),
  "utf8",
);
const reconciliationSource = fs.readFileSync(
  path.join(repositoryRoot, "scripts", "build-monthly-prf-register.mjs"),
  "utf8",
);

function breakdownTemplateIsSafe() {
  const style = /\.breakdown-row\s+td\s*\{([^}]*)\}/i.exec(expectedStylesheet)?.[1] || "";
  const forbiddenLayoutOverrides = /(?:font-size|padding|height|line-height|text-align|vertical-align|background|margin|transform)\s*:/i;
  return /color:\s*#77736d/i.test(style) && /font-style:\s*italic/i.test(style) &&
    !forbiddenLayoutOverrides.test(style) && !/\.breakdown-note\b/i.test(expectedStylesheet);
}

function groupedSortingIsSafe() {
  return /querySelectorAll\("tr:not\(\.tot\):not\(\.breakdown-row\)"\)/.test(expectedBehavior) &&
    /b\.parent\.cells\[8\]/.test(expectedBehavior) &&
    /block\.rows\.forEach/.test(expectedBehavior) &&
    !/querySelectorAll\("tr:not\(\.tot\)"\)/.test(expectedBehavior);
}

function reusableGeneratorsAreSafe() {
  const breakdownMarkup = /<tr class="breakdown-row">([\s\S]*?)<\/tr>/.exec(migrationSource)?.[1] || "";
  const cells = Array.from(
    breakdownMarkup.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g),
    (cell) => cell[1].trim(),
  );
  const suppressedCellsAreBlank = cells.length === 10 &&
    [1, 2, 3, 4, 6, 9].every((index) => cells[index] === "");
  const countedCellsRemain = cells.length === 10 && cells[0] && cells[5] && cells[7] && cells[8];
  const reconciliationSkipsChildren = /\b(?:tot\|breakdown-row\|breakdown-note)\b/.test(reconciliationSource) &&
    /htmlRowFlag/.test(reconciliationSource);
  return suppressedCellsAreBlank && countedCellsRemain && reconciliationSkipsChildren &&
    !/breakdown-note/.test(migrationSource);
}

if (!breakdownTemplateIsSafe()) {
  failures.push("templates/report.css: breakdown rows may only override muted text colour and italic style");
}
if (!groupedSortingIsSafe()) {
  failures.push("templates/report.js: sorting must treat each parent and its breakdown rows as one counted block");
}
if (!reusableGeneratorsAreSafe()) {
  failures.push("reusable generators must suppress child metadata and exclude breakdown rows from reconciliation counts");
}

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
  const row = Array.from(
    source.matchAll(/<tr\b([^>]*)class=["'][^"']*\btot\b[^"']*["']([^>]*)>([\s\S]*?)<\/tr>/gi),
  ).find((match) => new RegExp(label, "i").test(plainText(match[3])));
  if (!row) return null;
  const attributes = `${row[1]} ${row[2]}`;
  const explicitTotal = /data-usd=["']([\d,.]+)["']/i.exec(attributes);
  if (explicitTotal) return amount(explicitTotal[1]);
  const cells = Array.from(row[3].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi));
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
        tbody[1].matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi),
        (row) => ({
          attributes: row[1],
          cells: Array.from(row[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
        }),
      )
        .filter(({ attributes, cells }) =>
          cells.length === 10 && !/\b(?:tot|breakdown-row|breakdown-note)\b/i.test(attributes),
        )
        .map(({ cells }) => amount(plainText(cells[8][1])));
      return usdValues.every((value, index) => index === 0 || usdValues[index - 1] >= value);
    },
  );
}

function prf295BreakdownIsValid(source) {
  if (!/TDSG-2026-08-295/.test(source)) return true;
  const rows = Array.from(source.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi), (match) => ({
    attributes: match[1],
    cells: Array.from(match[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
  }));
  const parentRows = rows.filter(({ attributes, cells }) =>
    /\bpayment-parent\b/.test(attributes) && cells.length === 10 &&
      plainText(cells[1][1]) === "TDSG-2026-08-295",
  );
  const children = rows.filter(({ attributes }) => /\bbreakdown-row\b/.test(attributes));
  if (parentRows.length !== 1 || children.length !== 4 ||
      children.some(({ cells }) => cells.length !== 10)) return false;
  const parent = parentRows[0].cells;
  if (plainText(parent[5][1]) !== "DDI and customs-clearance fees — 4 underlying vessel cost lines" ||
      plainText(parent[4][1]) !== "Mohzain Transit-Transport-Logistics" ||
      plainText(parent[6][1]) !== "Other Purchase Costs" ||
      plainText(parent[7][1]) !== "GNF 91,118,428" ||
      amount(plainText(parent[8][1])) !== 10372 || plainText(parent[9][1]) !== "1 : 8785") {
    return false;
  }
  const childNumbers = children.map(({ cells }) => plainText(cells[0][1]));
  const childMetadataIsBlank = children.every(({ cells }) =>
    cells.slice(1, 5).every((cell) => plainText(cell[1]) === "") &&
      plainText(cells[6][1]) === "" && plainText(cells[9][1]) === "",
  );
  const childContentIsComplete = children.every(({ cells }) =>
    /^1\.[1-4]$/.test(plainText(cells[0][1])) && plainText(cells[5][1]) !== "" &&
      /^GNF\s+[\d,]+$/.test(plainText(cells[7][1])) && amount(plainText(cells[8][1])) > 0,
  );
  const childGnf = children.reduce((sum, { cells }) => sum + amount(plainText(cells[7][1])), 0);
  const childUsd = children.reduce((sum, { cells }) => sum + amount(plainText(cells[8][1])), 0);
  const countedPrfRows = rows.filter(({ attributes, cells }) =>
    cells.length === 10 && !/\b(?:tot|breakdown-row|breakdown-note)\b/.test(attributes) &&
      plainText(cells[1][1]) === "TDSG-2026-08-295",
  );
  return childNumbers.join(",") === "1.1,1.2,1.3,1.4" &&
    childMetadataIsBlank && childContentIsComplete && countedPrfRows.length === 1 &&
    childGnf === amount(plainText(parent[7][1])) && childUsd === amount(plainText(parent[8][1])) &&
    !/\bbreakdown-note\b/.test(source) &&
    !/Lines 1\.1(?:&ndash;|–)1\.4 are breakdowns/.test(source) &&
    /<tr class=["']tot["']><td colspan=["']7["']>Rouge POB subtotal\s*&mdash;\s*1 payment<\/td><td class=["']num["']><\/td><td class=["']num["']>10,372<\/td><td><\/td><\/tr>/.test(source);
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
  let expectedWeek = null;
  try {
    expectedWeek = reportIsoWeek(source);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
  }
  const reportLabelWeeks = Array.from(
    source.matchAll(/Weekly Payment Report\s*(?:&middot;|&#183;|·)\s*Week\s*(\d+)/gi),
    (match) => Number(match[1]),
  );
  const titleWeek = Number(/<title>[\s\S]*?Week\s*(\d+)/i.exec(source)?.[1] || 0);
  const requiresPaymentMode = !/[\\/]2026-07[\\/]/.test(name);
  const embeddedStylesheet = embeddedAsset(source, "style");
  const embeddedBehavior = embeddedAsset(source, "script");
  const usesCurrentTemplate = /--report-template-version:\s*2/.test(source);
  const checks = [
    [count(source, /<style\b/gi) === 1, "must contain exactly one stylesheet"],
    [count(source, /<script\b/gi) === 1, "must contain exactly one script"],
    [expectedWeek !== null && filenameWeek(path.basename(file)) === expectedWeek, "filename must use the ISO week number derived from the report end date"],
    [expectedWeek !== null && titleWeek === expectedWeek, "document title must use the ISO week number derived from the report end date"],
    [expectedWeek !== null && reportLabelWeeks.length >= 2 && reportLabelWeeks.every((week) => week === expectedWeek), "visible report labels must consistently use the ISO week number"],
    [!/\breceipt lines\b/i.test(source), "subtotal wording must use payment lines, not receipt lines"],
    [!usesCurrentTemplate || embeddedStylesheet === expectedStylesheet, "embedded stylesheet must match templates/report.css; regenerate the report"],
    [!usesCurrentTemplate || embeddedBehavior === expectedBehavior, "embedded behavior must match templates/report.js; regenerate the report"],
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
      !/TDSG-2026-08-289/.test(source) || /Guinea Customs \/ SACO Shipping Guinea SARL/.test(source),
      "PRF 289 must identify the customs authority and invoice supplier, not the vessel",
    ],
    [
      !/TDSG-2026-08-290/.test(source) || /Richfull Guinea SARL/.test(source),
      "PRF 290 must identify the invoice beneficiary, not the vessel",
    ],
    [
      !/TDSG-2026-08-283/.test(source) ||
        /Conakry Terminal \/ West Africa Container Agency - Guinea/.test(source),
      "PRF 283 must identify its actual logistics suppliers",
    ],
    [/\.sort\(/.test(source), "must retain descending sorting"],
    [!requiresPaymentMode || detailTablesAreUsdDescending(source), "detail tables must be stored in descending USD order"],
    [prf295BreakdownIsValid(source), "PRF 295 must use one counted parent row plus four non-counted vessel breakdown rows"],
    [!/TDSG-2026-08-295/.test(source) || usesCurrentTemplate, "PRF 295 report must use the current grouped-row template"],
    [/overflow-x:\s*auto/.test(source), "must retain mobile table scrolling"],
  ];

  checks.forEach(([passed, message]) => {
    if (!passed) failures.push(`${name}: ${message}`);
  });

  const detailRows = Array.from(
    source.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi),
    (match) => ({
      attributes: match[1],
      cells: Array.from(match[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)),
    }),
  );
  const modes = detailRows
    .filter(({ attributes, cells }) => cells.length === 10 && !/\b(?:tot|breakdown-row|breakdown-note)\b/.test(attributes))
    .map(({ cells }) => plainText(cells[3][1]));
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

  const originalAmountCells = detailRows
    .filter(({ attributes, cells }) =>
      (cells.length === 9 || cells.length === 10) && !/\b(?:tot|breakdown-note)\b/.test(attributes),
    )
    .map(({ cells }) => plainText(cells[cells.length - 3][1]));
  if (originalAmountCells.some((value) => !/^(?:GNF|USD|EUR)\s+[\d,.]+(?:\s+\+\s+(?:GNF|USD|EUR)\s+[\d,.]+)?$/.test(value))) {
    failures.push(`${name}: every detail row must show its original currency code and amount`);
  }
  if (/<td\b[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>[^<]*\s+\+\s+(?:GNF|USD|EUR)\b/i.test(source)) {
    failures.push(`${name}: mixed-currency Original Amount values must split before the plus sign`);
  }
  if (!/<td\b[^>]*class=["'][^"']*num[^"']*["'][^>]*>\s*(?:GNF|USD|EUR)\s+[\d,.]+\s*<\/td>/.test(source)) {
    failures.push(`${name}: Original Amount values must remain right-aligned`);
  }

  const tdsgSummary = summaryAmount(source, "summary-total");
  const rougeSummary = summaryAmount(source, "rouge-total");
  const weekTotal = summaryAmount(source, "grand");
  const tdsgSubtotal = tableSubtotal(source, "TDSG subtotal");
  const rougeSubtotal = tableSubtotal(source, "Rouge POB (?:subtotal|total)");

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
