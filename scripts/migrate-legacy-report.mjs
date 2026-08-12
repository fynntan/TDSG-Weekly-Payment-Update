import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error(
    "Usage: node scripts/migrate-legacy-report.mjs <legacy-report.html> <output-report.html>",
  );
  process.exit(1);
}

function decode(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function number(value) {
  return Number(decode(value).replace(/[^\d.-]/g, "")) || 0;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textCell(value) {
  return escapeHtml(decode(value)).replace(/'/g, "&#x27;");
}

function format(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function categoryClass(category) {
  const label = category.toLowerCase();
  if (label.includes("staff")) return "staff";
  if (label.includes("site")) return "site";
  if (label.includes("office")) return "office";
  if (label.includes("communication")) return "comm";
  if (label.includes("machine") || label.includes("supplies")) return "parts";
  if (label.includes("freight") || label.includes("logistics")) return "log";
  return "ga";
}

function paymentMode(row, isRouge) {
  if (isRouge) return "Rouge POB";
  if (/TDSG[\/-]CHN-/i.test(row.prf)) return "OCBC";
  const custodian = row.payee.match(/^Petty Cash\s*-\s*(.+)$/i)?.[1]?.trim();
  if (custodian) return `Petty Cash - ${custodian}`;
  return "Ecobank";
}

function normalizedPurpose(row) {
  const approvedDescriptions = {
    "TDSG/CHN-2026-37":
      "Purchase Hardware and Accessories (ZZTOP20260729)",
    "TDSG/CHN-2026-38":
      "Purchase Cummins Engine Spare Parts (TJDH2026-TDSGS-005)",
    "TDSG/CHN-2026-39":
      "Purchase General Materials (ZZTOP20260730)",
    "TDSG-2026-08-278": "Working Advance - July 2026",
    "TDSG-2026-08-279": "Site Canteen Purchases - July 2026",
    "TDSG-2026-08-280": "Kalil's Service Fee - August 2026",
    "TDSG-2026-08-281":
      "Container Freight - July 2026 (Winning Ocean WA2644 / WA2649)",
    "TDSG-2026-08-283":
      "Forwarding Fee - Cali - Wirtgen Spare Parts (BL HLCUHAM260530640)",
  };
  return approvedDescriptions[row.prf] || row.purpose;
}

function normalizedPayee(row) {
  const approvedPayees = {
    "TDSG-2026-08-278": "Various Site Suppliers",
    "TDSG-2026-08-279": "Various Canteen Suppliers",
    "TDSG-2026-08-280": "Kalil",
    "TDSG-2026-08-281": "Aliou Bah",
    "TDSG-2026-08-283": "Cali",
  };
  if (approvedPayees[row.prf]) return approvedPayees[row.prf];
  return row.payee.replace(/^Petty Cash\s*-\s*/i, "").trim();
}

function rowsFrom(tableHtml) {
  return Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi))
    .map((match) => match[1])
    .filter((row) => !/<th\b/i.test(row) && !/subtotal/i.test(row))
    .map((row) =>
      Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map(
        (cell) => cell[1],
      ),
    )
    .filter((cells) => cells.length === 9)
    .map((cells) => ({
      prf: decode(cells[1]),
      date: decode(cells[2]),
      payee: decode(cells[3]),
      purpose: decode(cells[4]),
      category: decode(cells[5]),
      gnf: decode(cells[6]),
      usd: decode(cells[7]),
      rate: decode(cells[8]),
    }));
}

function tableMarkup(rows, label, isRouge = false) {
  const totalGnf = rows.reduce((sum, row) => sum + number(row.gnf), 0);
  const totalUsd = rows.reduce((sum, row) => sum + number(row.usd), 0);
  const rowsHtml = rows
    .map(
      (row, index) => `              <tr>
                <td>${index + 1}</td>
                <td>${textCell(row.prf)}</td>
                <td>${textCell(row.date)}</td>
                <td>${paymentMode(row, isRouge)}</td>
                <td><b>${textCell(normalizedPayee(row))}</b></td>
                <td>${textCell(normalizedPurpose(row))}</td>
                <td><span class="tag ${categoryClass(row.category)}">${textCell(row.category)}</span></td>
                <td class="num">${textCell(row.gnf)}</td>
                <td class="num">${textCell(row.usd)}</td>
                <td>${textCell(row.rate)}</td>
              </tr>`,
    )
    .join("\n");
  const plural = rows.length === 1 ? "payment" : "payments";

  return `          <table>
            <thead>
              <tr>
                <th>No</th><th>PRF No</th><th>Payment Date</th><th>Payment Mode</th><th>Payee / Supplier</th><th>Purpose</th><th>Category</th><th class="num">GNF</th><th class="num">USD</th><th>Ex. rate</th>
              </tr>
            </thead>
            <tbody>
${rowsHtml}
              <tr class="tot">
                <td colspan="7">${label} subtotal &mdash; ${rows.length} ${plural}</td>
                <td class="num">${format(totalGnf)}</td>
                <td class="num">${format(totalUsd)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>`;
}

function categoryRows(rows) {
  return Object.entries(
    rows.reduce((totals, row) => {
      totals[row.category] = (totals[row.category] || 0) + number(row.usd);
      return totals;
    }, {}),
  )
    .sort(([, left], [, right]) => right - left)
    .map(
      ([category, value]) => `          <div class="br sub"><span>&middot; ${textCell(category)}</span><span class="amt">${format(value)}</span></div>`,
    )
    .join("\n");
}

const legacy = fs.readFileSync(path.resolve(input), "utf8");
const logo = /--logo:url\("(data:image\/png;base64,[^"]+)"\)/i.exec(legacy)?.[1];
const tables = Array.from(legacy.matchAll(/<table\b[^>]*class=["'][^"']*\bfin\b[^"']*["'][^>]*>([\s\S]*?)<\/table>/gi)).map((match) => match[1]);
const reportDate = decode(/<h1[^>]*>[\s\S]*?([0-9]{2}&ndash;[0-9]{2}\s+August\s+2026)[\s\S]*?<\/h1>/i.exec(legacy)?.[1] || "");
const week = decode(/Weekly Payment Report\s*&middot;\s*Week\s*([^<]+)/i.exec(legacy)?.[1] || "").replace(/\s+of\s+\d+/i, "");
const prepared = decode(/Prepared by\s*<b>([^<]+)<\/b>/i.exec(legacy)?.[1] || "Finance");
const reviewed = decode(/Reviewed by\s*<b>([^<]+)<\/b>/i.exec(legacy)?.[1] || "");

if (!logo || tables.length < 2 || !reportDate || !week) {
  console.error("The source does not match the supported legacy TDSG report format.");
  process.exit(1);
}

const tdsgRows = rowsFrom(tables[0]);
const rougeRows = rowsFrom(tables[1]);
const tdsgUsd = tdsgRows.reduce((sum, row) => sum + number(row.usd), 0);
const rougeUsd = rougeRows.reduce((sum, row) => sum + number(row.usd), 0);
const css = fs.readFileSync(path.join(root, "templates", "report.css"), "utf8").trim();
const behavior = fs.readFileSync(path.join(root, "templates", "report.js"), "utf8").trim();

const report = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'" />
    <meta name="color-scheme" content="light" />
    <title>TDSG Weekly Payment Report &mdash; Week ${escapeHtml(week)} &middot; ${escapeHtml(reportDate)}</title>
    <style>
${css.split("\n").map((line) => (line.trim() ? `      ${line.trimEnd()}` : "")).join("\n")}
    </style>
  </head>
  <body>
    <header class="top">
      <img class="logo-mark" src="${logo}" alt="TOP emblem" />
      <span class="brand-name">TOP DEVELOPMENT SERVICES GUINEA SARLU</span>
    </header>
    <main class="w">
      <div class="eye">Weekly Payment Report &middot; Week ${escapeHtml(week)}</div>
      <h1>${escapeHtml(reportDate)}</h1>
      <div class="meta">Prepared by <b>${escapeHtml(prepared)}</b>${reviewed ? ` &middot; Reviewed by <b>${escapeHtml(reviewed)}</b>` : ""}</div>
      <section id="breakdown">
        <h2>Payment Summary by Category (USD)</h2>
        <div class="panel">
          <div class="br summary-total"><span>TDSG payments</span><span class="amt">${format(tdsgUsd)}</span></div>
${categoryRows(tdsgRows)}
          <div class="br rouge-total"><span>Rouge POB total</span><span class="amt">${format(rougeUsd)}</span></div>
${categoryRows(rougeRows).replace(/class="br sub"/g, 'class="br sub rouge-detail"')}
          <div class="br grand"><span>Week Total</span><span class="amt">${format(tdsgUsd + rougeUsd)}</span></div>
        </div>
      </section>
      <section id="detail">
        <h2>Payment Detail</h2>
        <div class="tw">
${tableMarkup(tdsgRows, "TDSG")}
        </div>
        <h2>Payment on behalf by Rouge</h2>
        <div class="tw r">
${tableMarkup(rougeRows, "Rouge POB", true)}
        </div>
      </section>
      <footer>Weekly Payment Report &middot; Week ${escapeHtml(week)}, ${escapeHtml(reportDate)} &middot; Prepared by Finance Department. GNF&rarr;USD at the BCRG rate for each payment date; USD/EUR payments carry no GNF/rate.</footer>
    </main>
    <script>
${behavior.split("\n").map((line) => (line.trim() ? `      ${line.trimEnd()}` : "")).join("\n")}
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(path.resolve(output), report, "utf8");
console.log(`Migrated legacy report: ${path.resolve(output)}`);
