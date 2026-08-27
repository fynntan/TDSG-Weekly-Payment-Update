import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const inputArgument = process.argv[2];
const outputArgument = process.argv[3];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!inputArgument || !outputArgument) {
  fail(
    "Provide input and output HTML files. Usage: npm run report:prepare -- <input.html> <reports/YYYY-MM/output.html>",
  );
}

const inputPath = path.resolve(inputArgument);
const outputPath = path.resolve(outputArgument);
const previousOutput = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath)
  : null;

function restoreOutput() {
  if (previousOutput) {
    fs.writeFileSync(outputPath, previousOutput);
  } else if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath);
  }
}

if (path.extname(inputPath).toLowerCase() !== ".html" ||
    path.extname(outputPath).toLowerCase() !== ".html") {
  fail("Both input and output must be .html files.");
}

if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
  fail(`Input file not found: ${inputPath}`);
}

const relativeOutput = path.relative(path.join(repositoryRoot, "reports"), outputPath);
if (relativeOutput.startsWith("..") || path.isAbsolute(relativeOutput)) {
  fail("Output must be stored below the repository reports directory.");
}

const source = fs.readFileSync(inputPath, "utf8");
const isLegacy = /<table\b[^>]*class=["'][^"']*\bfin\b/i.test(source);
const isCurrent = /class=["']top["']/.test(source) &&
  /class=["']panel["']/.test(source);

if (!isLegacy && !isCurrent) {
  fail("Input does not match a supported legacy or current TDSG report format.");
}

const generator = isLegacy ? "migrate-legacy-report.mjs" : "standardize-report.mjs";
const generation = spawnSync(
  process.execPath,
  [path.join(scriptDirectory, generator), inputPath, outputPath],
  { cwd: repositoryRoot, encoding: "utf8", stdio: "inherit" },
);

if (generation.error) {
  restoreOutput();
  fail(generation.error.message);
}
if (generation.status !== 0) {
  restoreOutput();
  process.exit(generation.status || 1);
}

const verification = spawnSync(
  process.execPath,
  [path.join(scriptDirectory, "verify-reports.mjs")],
  { cwd: repositoryRoot, encoding: "utf8", stdio: "inherit" },
);

if (verification.error) {
  restoreOutput();
  fail(verification.error.message);
}
if (verification.status !== 0) {
  restoreOutput();
  console.error("Report preparation failed; the previous output was restored.");
  process.exit(verification.status || 1);
}

console.log(`Prepared and verified report: ${outputPath}`);
