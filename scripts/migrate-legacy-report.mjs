import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reportIsoWeek } from "./report-period.mjs";

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
  const approvedModes = {
    "TDSG-2026-08-285": "Petty Cash - Geng Huatong",
    "TDSG-2026-08-286": "Petty Cash - Liu Qun Tao",
    "TDSG-2026-08-287": "Petty Cash - Chen Li Hu",
    "TDSG-2026-08-291": "Petty Cash - Chen Li Hu",
    "TDSG-2026-08-292": "Petty Cash - Zhang Xi Lian",
    "TDSG-2026-08-293": "Petty Cash - Zhang Xi Lian",
  };
  if (approvedModes[row.prf]) return approvedModes[row.prf];
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
      "Port, Shipping, Container and Demurrage Charges - Wirtgen Spare Parts (BL HLCUHAM260530640)",
    "TDSG-2026-07-251": "Purchase CAT Lubricants and Accessories",
    "TDSG-2026-07-258":
      "Purchase Local Spare Parts - May to June 2026 (2026-0005 / 2026-0006)",
    "TDSG-2026-07-256":
      "Clearance and Agent Fees - Winning Integrity and DHL Spare Parts (TOP-0104 / TOP-0105)",
    "TDSG-2026-07-272": "Purchase Oxygen and Acetylene Gases",
    "TDSG-2026-08-282":
      "Community Services - July 2026 Production (009/GMS/2026)",
    "TDSG/CHN-2026-40": "Freight - MV Winning Rich (FS26-3197)",
    "TDSG/CHN-2026-41": "Insurance Fee",
    "TDSG-2026-08-285": "Petty Cash Top-up - Conakry, August 2026",
    "TDSG-2026-08-286": "Canteen Working Advance - August 2026",
    "TDSG-2026-08-287": "Site Working Advance - August 2026",
    "TDSG-2026-08-284":
      "Import Tax - Winning Ocean (WB2649SH301; 2026 S 2089)",
    "TDSG/CHN-2026-42":
      "Purchase Wirtgen 280SM Spare Parts (WHK-TOP-2026-005 / HP2026-005)",
    "TDSG-2026-08-291": "Expatriate Salary - Camp, August 2026",
    "TDSG-2026-08-292":
      "Transportation Fee - Wirtgen Spare Parts (TVP-OFF-036 / CKY203816)",
    "TDSG-2026-08-293":
      "Expatriate Salary - Office, August 2026 (TVP-OFF-037)",
    "TDSG-2026-08-289":
      "Import Tax and Forwarding Fee - Wirtgen Spare Parts (CKY203816)",
    "TDSG-2026-08-290":
      "Detention Fee (WP2643SH301; FACT2026080294)",
  };
  return approvedDescriptions[row.prf] || row.purpose;
}

function normalizedPayee(row) {
  const approvedPayees = {
    "TDSG-2026-08-278": "Various Site Suppliers",
    "TDSG-2026-08-279": "Various Canteen Suppliers",
    "TDSG-2026-08-280": "Kalil",
    "TDSG-2026-08-281": "Aliou Bah",
    "TDSG-2026-08-283":
      "Conakry Terminal / West Africa Container Agency - Guinea",
    "TDSG-2026-07-251": "Neemba Guinée",
    "TDSG-2026-07-258": "Hua Teng SARLU",
    "TDSG-2026-07-256": "STE Sahel Entreprise SARLU",
    "TDSG-2026-07-272": "SIFIG SARLU",
    "TDSG-2026-08-282": "Société La Guinée Mining Services",
    "TDSG-2026-08-285": "Geng Huatong",
    "TDSG-2026-08-286": "Various Canteen Suppliers",
    "TDSG-2026-08-287": "Various Site Suppliers",
    "TDSG-2026-08-284": "Guinea Customs / Winning Ocean",
    "TDSG-2026-08-291": "Expatriate Staff - Camp",
    "TDSG-2026-08-292": "Biro Transport / Alula Express",
    "TDSG-2026-08-293": "Expatriate Staff - Office",
    "TDSG-2026-08-289": "Guinea Customs / SACO Shipping Guinea SARL",
    "TDSG-2026-08-290": "Richfull Guinea SARL",
  };
  if (approvedPayees[row.prf]) return approvedPayees[row.prf];
  return row.payee.replace(/^Petty Cash\s*-\s*/i, "").trim();
}

function originalAmount(row) {
  const approvedAmounts = {
    "TDSG/CHN-2026-37": "USD 18,513",
    "TDSG/CHN-2026-38": "USD 294,725.29",
    "TDSG/CHN-2026-39": "USD 85,941",
    "TDSG-2026-08-280": "USD 1,000",
    "TDSG/CHN-2026-40": "USD 7,500",
    "TDSG/CHN-2026-41": "USD 1,898.22",
    "TDSG/CHN-2026-42": "EUR 114,253.30",
    "TDSG-2026-08-291": "USD 7,000 + GNF 11,040,000",
    "TDSG-2026-08-293": "USD 600",
  };
  if (approvedAmounts[row.prf]) return { display: approvedAmounts[row.prf] };
  if (number(row.gnf)) return { code: "GNF", display: `GNF ${row.gnf}` };
  const code = /EUR/i.test(row.rate) ? "EUR" : "USD";
  return { code, display: `${code} ${row.usd}` };
}

function exchangeRate(row) {
  if (!/GNF/.test(originalAmount(row).display)) return "—";
  const match = row.rate.match(/1\s*:\s*([\d,]+)/);
  return match ? `1 : ${match[1].replace(/,/g, "")}` : row.rate;
}

function originalAmountMarkup(row) {
  return textCell(originalAmount(row).display).replace(/ \+ /g, "<br />+ ");
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
  const totalUsd = rows.reduce((sum, row) => sum + number(row.usd), 0);
  const sortedRows = rows
    .map((row, sourceIndex) => ({ row, sourceIndex }))
    .sort((left, right) =>
      number(right.row.usd) - number(left.row.usd) ||
      left.sourceIndex - right.sourceIndex,
    )
    .map(({ row }) => row);
  const rowsHtml = sortedRows
    .map(
      (row, index) => `              <tr>
                <td>${index + 1}</td>
                <td>${textCell(row.prf)}</td>
                <td>${textCell(row.date)}</td>
                <td>${paymentMode(row, isRouge)}</td>
                <td><b>${textCell(normalizedPayee(row))}</b></td>
                <td>${textCell(normalizedPurpose(row))}</td>
                <td><span class="tag ${categoryClass(row.category)}">${textCell(row.category)}</span></td>
                <td class="num">${originalAmountMarkup(row)}</td>
                <td class="num">${textCell(row.usd)}</td>
                <td>${textCell(exchangeRate(row))}</td>
              </tr>`,
    )
    .join("\n");
  const plural = sortedRows.length === 1 ? "payment" : "payments";

  return `          <table>
            <thead>
              <tr>
                <th>No</th><th>PRF No</th><th>Payment Date</th><th>Payment Mode</th><th>Payee / Supplier</th><th>Purpose</th><th>Category</th><th>Original Amount</th><th>USD</th><th>Ex. Rate</th>
              </tr>
            </thead>
            <tbody>
${rowsHtml}
              <tr class="tot">
                <td colspan="7">${label} subtotal &mdash; ${sortedRows.length} ${plural}</td>
                <td class="num"></td>
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
const reportDate = decode(/<h1[^>]*>[\s\S]*?([0-9]{2}\s*&ndash;\s*[0-9]{2}\s+[A-Za-z]+\s+[0-9]{4})[\s\S]*?<\/h1>/i.exec(legacy)?.[1] || "");
const week = reportIsoWeek(legacy);
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
      <footer>Weekly Payment Report &middot; Week ${escapeHtml(week)} &middot; ${escapeHtml(reportDate)} &middot; Prepared by Finance Department. GNF payments are converted to USD using the BCRG rate applicable on each payment date.</footer>
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
