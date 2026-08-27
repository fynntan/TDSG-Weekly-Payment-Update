import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const inputArgument = process.argv[2];
const outputArgument = process.argv[3] || inputArgument;

if (!inputArgument) {
  fail(
    "Provide an input HTML file. Usage: node scripts/standardize-report.mjs <input.html> [output.html]",
  );
}

const inputPath = path.resolve(inputArgument);
const outputPath = path.resolve(outputArgument);

if (path.extname(inputPath).toLowerCase() !== ".html") {
  fail("The input must be an .html file.");
}

if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
  fail(`Input file not found: ${inputPath}`);
}

const source = fs.readFileSync(inputPath, "utf8");
const title = source.match(/<title>([\s\S]*?)<\/title>/i);
const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

if (!title || !body) {
  fail("The input does not contain a complete <title> and <body>.");
}

const stylesheet = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.css"), "utf8")
  .trim();
const behavior = fs
  .readFileSync(path.join(repositoryRoot, "templates", "report.js"), "utf8")
  .trim();

const bodyWithoutGeneratedAssets = body[1]
  .replace(/\s*<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/\s*<div\s+class=["']org["'][^>]*>[\s\S]*?<\/div>/i, "");
const bodyLines = bodyWithoutGeneratedAssets.split(/\r?\n/);
const nonEmptyLines = bodyLines.filter((line) => line.trim());
const commonIndent = Math.min(
  ...nonEmptyLines.map((line) => line.match(/^\s*/)[0].length),
);
const cleanBody = bodyLines
  .map((line) => line.slice(Math.min(commonIndent, line.length)).trimEnd())
  .join("\n")
  .trim()
  .replace(
    /(<th\b[^>]*>)\s*(?:GNF|Original Currency)\s*(<\/th>)/gi,
    "$1Original Amount$2",
  )
  .replace(
    /(<td\b[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>\s*(?:GNF|USD|EUR)\s+[\d,.]+)\s+\+\s+((?:GNF|USD|EUR)\s+[\d,.]+\s*<\/td>)/gi,
    "$1<br />+ $2",
  );

if (!/class=["']top["']/.test(cleanBody)) {
  fail("The input is missing the report header (.top).");
}

if (!/class=["']panel["']/.test(cleanBody) || !/<table\b/i.test(cleanBody)) {
  fail("The input is missing the summary panel or payment tables.");
}

const document = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'"
    />
    <meta name="color-scheme" content="light" />
    <title>${title[1].trim()}</title>
    <style>
${stylesheet
  .split("\n")
  .map((line) => (line.trim() ? `      ${line.trimEnd()}` : ""))
  .join("\n")}
    </style>
  </head>
  <body>
${cleanBody
  .split("\n")
  .map((line) => `    ${line.trimEnd()}`)
  .join("\n")}
    <script>
${behavior
  .split("\n")
  .map((line) => (line.trim() ? `      ${line.trimEnd()}` : ""))
  .join("\n")}
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, document, { encoding: "utf8", flag: "w" });

console.log(`Standardized report: ${outputPath}`);
