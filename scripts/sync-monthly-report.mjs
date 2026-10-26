import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const write = args.includes("--write");
const positional = args.filter((arg) => arg !== "--write");
if (positional.length !== 2) {
  console.error("Usage: node scripts/sync-monthly-report.mjs <repository-report.html> <monthly-folder> [--write]");
  process.exit(1);
}

const source = fs.realpathSync(path.resolve(root, positional[0]));
const reportsRoot = fs.realpathSync(path.join(root, "reports"));
const relative = path.relative(reportsRoot, source);
if (relative.startsWith("..") || path.isAbsolute(relative) || !/\.html$/i.test(source)) {
  throw new Error("Source must be an HTML report inside this repository's reports folder.");
}
const folder = fs.realpathSync(path.resolve(positional[1]));
if (!fs.statSync(folder).isDirectory()) throw new Error("Destination must be an existing monthly folder.");
const destination = path.join(folder, path.basename(source));
if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) {
  throw new Error("Refusing to replace a symbolic link.");
}
const check = spawnSync(process.execPath, [path.join(root, "scripts", "verify-reports.mjs")], {
  cwd: root, encoding: "utf8",
});
process.stdout.write(check.stdout || "");
process.stderr.write(check.stderr || "");
if (check.status !== 0) process.exit(check.status || 1);

const bytes = fs.readFileSync(source);
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
const previous = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
if (previous && bytes.equals(previous)) {
  console.log("Monthly report already matches the checked repository report.");
  process.exit(0);
}
console.log(`Source: ${source}\nDestination: ${destination}\nSHA-256: ${digest(bytes)}`);
if (!write) {
  console.log("Preview only. Add --write to back up and synchronize this exact report.");
  process.exit(0);
}
if (previous) {
  const backupFolder = path.join(root, "output", "monthly-sync-backups");
  fs.mkdirSync(backupFolder, { recursive: true });
  const backup = path.join(backupFolder, `${path.basename(source, ".html")}.${digest(previous)}.html`);
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, previous, { flag: "wx" });
  if (!fs.readFileSync(backup).equals(previous)) throw new Error("Backup verification failed; destination was not changed.");
  if (!fs.readFileSync(destination).equals(previous)) throw new Error("Destination changed during synchronization; retry after review.");
  console.log(`Previous monthly version preserved privately: ${backup}`);
}
fs.copyFileSync(source, destination);
if (!fs.readFileSync(destination).equals(bytes)) throw new Error("Post-copy byte verification failed.");
console.log("Monthly report synchronized and verified byte-for-byte.");
