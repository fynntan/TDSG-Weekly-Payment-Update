import fs from "node:fs";
import path from "node:path";

function plainText(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:mdash|ndash);|&#x?201[34];/gi, "-")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function amount(value) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function replaceCell(row, cell, value) {
  return row.slice(0, cell.index) +
    cell[0].replace(cell[1], value) +
    row.slice(cell.index + cell[0].length);
}

function standardizeTable(tbody) {
  return tbody.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi, (row, attributes, body) => {
    const cells = Array.from(body.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi));
    if (/\btot\b/i.test(attributes)) {
      if (cells.length < 3) return row;
      const updatedBody = replaceCell(body, cells[1], "");
      return row.replace(body, updatedBody);
    }
    if (cells.length !== 9 && cells.length !== 10) return row;

    const originalCell = cells[cells.length - 3];
    const usdCell = cells[cells.length - 2];
    const rateCell = cells[cells.length - 1];
    const originalText = plainText(originalCell[1]);
    const usdText = plainText(usdCell[1]);
    const rateText = plainText(rateCell[1]);
    const existing = /^(GNF|USD|EUR)\s+(.+)$/i.exec(originalText);
    const code = existing?.[1]?.toUpperCase() ||
      (amount(originalText) ? "GNF" : /EUR/i.test(rateText) ? "EUR" : "USD");
    const sourceAmount = existing?.[2] || (code === "GNF" ? originalText : usdText);
    const updatedBody = replaceCell(body, originalCell, `${code} ${sourceAmount}`);
    return row.replace(body, updatedBody);
  });
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/standardize-original-currency.mjs <report.html> [...]");
  process.exit(1);
}

for (const file of files) {
  const resolved = path.resolve(file);
  let source = fs.readFileSync(resolved, "utf8");
  source = source.replace(/(<th\b[^>]*>)\s*GNF\s*(<\/th>)/g, "$1Original Currency$2");
  source = source.replace(/<th\b[^>]*class=["'][^"']*num[^"']*["'][^>]*>\s*Original Currency\s*<\/th>/g, "<th>Original Currency</th>");
  source = source.replace(/<th\b[^>]*class=["'][^"']*num[^"']*["'][^>]*>\s*USD\s*<\/th>/g, "<th>USD</th>");
  source = source.replace(/Week (\d+),\s*/g, "Week $1 &middot; ");
  source = source.replace(
    /Prepared by Finance Department\.\s*GNF&rarr;USD at the BCRG rate\s*for each\s*payment date; USD\/EUR payments carry no GNF\/rate\./g,
    "Prepared by Finance Department. GNF payments are converted to USD using the BCRG rate applicable on each payment date.",
  );
  source = source.replace(
    /Prepared by Finance Department\. Original-currency amounts are shown in the detail table\. GNF payments are converted to USD using the BCRG rate applicable on each payment date; USD payments retain their original amount\./g,
    "Prepared by Finance Department. GNF payments are converted to USD using the BCRG rate applicable on each payment date.",
  );
  source = source.replace(/<tbody>([\s\S]*?)<\/tbody>/gi, (match, tbody) =>
    match.replace(tbody, standardizeTable(tbody)),
  );
  fs.writeFileSync(resolved, source, "utf8");
  console.log(`Standardized original currency: ${resolved}`);
}
