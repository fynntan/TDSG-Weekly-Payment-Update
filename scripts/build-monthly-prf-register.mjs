import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, "outputs", "august-2026-prf-reconciliation");
const outputPath = path.join(outputDirectory, "TDSG August 2026 PRF Clearance and HTML Reconciliation.xlsx");
const reportDirectory = path.join(repositoryRoot, "reports", "2026-08");
const asOfDate = excelDate(2026, 8, 27);

function excelDate(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0);
}

function plainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, " + ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&mdash;/gi, "—")
    .replace(/&middot;/gi, "·")
    .replace(/&ndash;/gi, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePrf(value) {
  return value
    .replace(/^TGM\/CHN\//i, "TDSG/CHN-")
    .replace(/^TDSG-CHN-/i, "TDSG/CHN-")
    .replace(/^TDSG\/CHN\//i, "TDSG/CHN-")
    .trim();
}

function validateSourceData(htmlRows) {
  if (register.length === 0) throw new Error("The August PRF register is empty.");
  if (htmlRows.length === 0) throw new Error(`No weekly HTML payment rows were found in ${reportDirectory}.`);

  const requiredFields = ["prf", "prfDate", "source", "mode", "payee", "purpose", "category", "component", "currency", "amount", "componentStatus", "overallStatus", "folder"];
  register.forEach((item, index) => {
    for (const field of requiredFields) {
      if (item[field] === null || item[field] === undefined || item[field] === "") {
        throw new Error(`Register row ${index + 1} is missing required field: ${field}.`);
      }
    }
    if (!Number.isFinite(item.amount) || item.amount <= 0) throw new Error(`Register row ${index + 1} has an invalid original amount.`);
    if (![0, 1].includes(item.countFlag)) throw new Error(`Register row ${index + 1} has an invalid PRF count flag.`);
    if (item.captured === "Yes" && (!item.expectedReport || !item.htmlReport)) {
      throw new Error(`Register row ${index + 1} is marked captured without both expected and actual HTML reports.`);
    }
  });

  const countedPrfs = register.filter((item) => item.countFlag === 1).map((item) => normalizePrf(item.prf));
  if (new Set(countedPrfs).size !== countedPrfs.length) throw new Error("A PRF is counted more than once in the register.");

  const htmlKeys = htmlRows.map((item) => `${item.file}|${item.no}|${item.prf}`);
  if (new Set(htmlKeys).size !== htmlKeys.length) throw new Error("Duplicate payment rows were extracted from the weekly HTML reports.");
}

async function prepareOutputDirectory() {
  const expectedParent = path.join(repositoryRoot, "outputs");
  if (path.dirname(outputDirectory) !== expectedParent || path.basename(outputDirectory) !== "august-2026-prf-reconciliation") {
    throw new Error(`Refusing to clean unexpected output directory: ${outputDirectory}`);
  }
  await fs.rm(outputDirectory, { recursive: true, force: true });
  await fs.mkdir(outputDirectory, { recursive: true });
}

function row({
  prf,
  prfDate,
  source = "Guinea",
  mode,
  payee,
  purpose,
  category,
  component,
  currency,
  amount,
  bankCurrency = null,
  bankAmount = null,
  bankDate = null,
  completionDate = null,
  componentStatus,
  overallStatus,
  dataCheck = "OK",
  notes = "",
  folder,
  countFlag = 1,
  expectedReport = "",
  captured = "No",
  htmlReport = "",
}) {
  return {
    prf,
    prfDate,
    source,
    mode,
    payee,
    purpose,
    category,
    component,
    currency,
    amount,
    bankCurrency,
    bankAmount,
    bankDate,
    completionDate,
    componentStatus,
    overallStatus,
    dataCheck,
    notes,
    folder,
    countFlag,
    expectedReport,
    captured,
    htmlReport,
  };
}

const register = [
  row({ prf: "TDSG-2026-08-278", prfDate: excelDate(2026, 8, 4), mode: "Petty Cash - Chen Li Hu", payee: "Various Site Suppliers", purpose: "Working Advance - July 2026", category: "Site Expenses", component: "GNF component", currency: "GNF", amount: 35144000, completionDate: excelDate(2026, 8, 4), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-07-278_CLH WORKING ADV FOR JUL'26_04AUG2026", expectedReport: "Week 1", captured: "Yes", htmlReport: "Week 1" }),
  row({ prf: "TDSG-2026-08-279", prfDate: excelDate(2026, 8, 4), mode: "Petty Cash - Liu Qun Tao", payee: "Various Canteen Suppliers", purpose: "Site Canteen Purchases - July 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 23510000, completionDate: excelDate(2026, 8, 4), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-07-279_LQT WORKING ADV FOR JUL'26_04AUG2026", expectedReport: "Week 1", captured: "Yes", htmlReport: "Week 1" }),
  row({ prf: "TDSG-2026-08-280", prfDate: excelDate(2026, 8, 4), mode: "Petty Cash - Li Yang Yang", payee: "Kalil", purpose: "Kalil's Service Fee - August 2026", category: "Conakry Office Expenses", component: "USD component", currency: "USD", amount: 1000, completionDate: excelDate(2026, 8, 4), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-280_KALIL'S SERVICE FEE FOR AUG'26_04AUG2026", expectedReport: "Week 1", captured: "Yes", htmlReport: "Week 1" }),
  row({ prf: "TDSG-2026-08-281", prfDate: excelDate(2026, 8, 4), mode: "Petty Cash - Li Yang Yang", payee: "Aliou Bah", purpose: "Container Freight - July 2026 (Winning Ocean WA2644 / WA2649)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 10000000, completionDate: excelDate(2026, 8, 4), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-281_CONTAINER FREIGHT RATE FOR JUL'26_04AUG2026", expectedReport: "Week 1", captured: "Yes", htmlReport: "Week 1" }),
  row({ prf: "TDSG-2026-08-282", prfDate: excelDate(2026, 8, 5), mode: "Ecobank", payee: "Société La Guinée Mining Services", purpose: "Community Services - July 2026 Production (009/GMS/2026)", category: "HR & Community", component: "GNF component", currency: "GNF", amount: 177826148, bankCurrency: "GNF", bankAmount: 177826148, bankDate: excelDate(2026, 8, 11), completionDate: excelDate(2026, 8, 11), componentStatus: "Cleared", overallStatus: "Completed", notes: "Bank statement posting and value date matched.", folder: "TDSG-2026-08-282_GMS_COMMUNITY SERVICES FOR JUL'26 PRODUCTION_05AUG2026", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG-2026-08-283", prfDate: excelDate(2026, 8, 7), mode: "Rouge POB", payee: "Conakry Terminal / West Africa Container Agency - Guinea", purpose: "Port, shipping, container and demurrage charges - Wirtgen spare parts (HLCUHAM260530640)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 6281905, completionDate: excelDate(2026, 8, 7), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-283_PYT ON BEHALF BY ROUGE_CALI-HLCUHAM260530640-WIRTGEN SPARE PART_FORWADING FEE_07AUG2026", expectedReport: "Week 1", captured: "Yes", htmlReport: "Week 1" }),
  row({ prf: "TDSG-2026-08-284", prfDate: excelDate(2026, 8, 10), mode: "Rouge POB", payee: "Guinea Customs / Winning Ocean", purpose: "Import Tax - Winning Ocean (WB2649SH301; 2026 S 2089)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 263561313, completionDate: excelDate(2026, 8, 10), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-284_PRF_PYT ON BEHALF BY ROUGE_WINNING PEACE_WB2649SH301_IMPORT TAX_10AUG2026", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG-2026-08-285", prfDate: excelDate(2026, 8, 13), mode: "Petty Cash - Geng Huatong (Ecobank withdrawal)", payee: "Geng Huatong", purpose: "Petty Cash Top-up - Conakry, August 2026", category: "Conakry Office Expenses", component: "GNF component", currency: "GNF", amount: 400000000, bankCurrency: "GNF", bankAmount: 400000000, bankDate: excelDate(2026, 8, 14), completionDate: excelDate(2026, 8, 14), componentStatus: "Cleared", overallStatus: "Partially completed", notes: "Ecobank statement shows GNF 250,000,000 + GNF 150,000,000 on 14 August.", folder: "TDSG-2026-08-285_PETTY CASH TOP UP FOR CONAKRY AUG'26_13AUG2026", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG-2026-08-285", prfDate: excelDate(2026, 8, 13), mode: "Cash withdrawal - USD", payee: "Geng Huatong", purpose: "Petty Cash Top-up - Conakry, August 2026", category: "Conakry Office Expenses", component: "USD component", currency: "USD", amount: 50000, componentStatus: "Pending bank deduction", overallStatus: "Partially completed", dataCheck: "Pending", notes: "Still listed in the rolling pending-bank-deduction register through 23 August; no confirming deduction found through 27 August.", folder: "TDSG-2026-08-285_PETTY CASH TOP UP FOR CONAKRY AUG'26_13AUG2026", countFlag: 0 }),
  row({ prf: "TDSG-2026-08-286", prfDate: excelDate(2026, 8, 14), mode: "Petty Cash - Liu Qun Tao", payee: "Various Canteen Suppliers", purpose: "Canteen Working Advance - August 2026", category: "Site Expenses", component: "GNF component", currency: "GNF", amount: 20705000, completionDate: excelDate(2026, 8, 14), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-286_LQT WORKING ADV FOR AUG'26_14AUG2026", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG-2026-08-287", prfDate: excelDate(2026, 8, 14), mode: "Petty Cash - Chen Li Hu", payee: "Various Site Suppliers", purpose: "Site Working Advance - August 2026", category: "Site Expenses", component: "GNF component", currency: "GNF", amount: 12990000, completionDate: excelDate(2026, 8, 14), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-287_CLH WORKING ADV FOR AUG'26_14AUG2026", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG-2026-08-288", prfDate: excelDate(2026, 8, 18), mode: "Ecobank", payee: "Safari Commerce SARL", purpose: "Transportation Fee from November 2025 to May 2026", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 690223394, componentStatus: "Pending bank deduction", overallStatus: "Pending", dataCheck: "Pending", notes: "In the rolling pending register through 23 August; no matching deduction found through 27 August.", folder: "TDSG-2026-08-288_SAFARI_TRSANSPORT FE FROM NOV'25 TO MAY'26_18AUG2026" }),
  row({ prf: "TDSG-2026-08-289", prfDate: excelDate(2026, 8, 19), mode: "Rouge POB", payee: "Alula Express", purpose: "Import Tax and Forwarding Fee - Wirtgen Spare Parts (CKY203816)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 15522072, completionDate: excelDate(2026, 8, 19), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-289_PYT ON BEHALF BY ROUGE_ALULA EXPRESS-CKY203816_WIRTGEN SPARE PART_IMPORT TAX & FORWADING FEE_19AUG2026", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-290", prfDate: excelDate(2026, 8, 18), mode: "Rouge POB", payee: "Winning Peace", purpose: "Detention Fee (WP2643SH301; FACT2026080294)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 15972480, completionDate: excelDate(2026, 8, 18), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-290_PYT ON BEHALF BY ROUGE_WINNING PEACE-WP2643SH301_DETENTION FEE_18AUG2026", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-291", prfDate: excelDate(2026, 8, 20), mode: "Petty Cash - Chen Li Hu", payee: "Expatriate Staff - Camp", purpose: "Expatriate Salary - Camp, August 2026", category: "Staff Costs", component: "USD component", currency: "USD", amount: 7000, completionDate: excelDate(2026, 8, 20), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-291_EXPATRIATE SALARY FOR CAMP AUG'26_20AUG2026", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-291", prfDate: excelDate(2026, 8, 20), mode: "Petty Cash - Chen Li Hu", payee: "Expatriate Staff - Camp", purpose: "Expatriate Salary - Camp, August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 11040000, completionDate: excelDate(2026, 8, 20), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-291_EXPATRIATE SALARY FOR CAMP AUG'26_20AUG2026", countFlag: 0, expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-292", prfDate: excelDate(2026, 8, 21), mode: "Petty Cash - Zhang Xi Lian", payee: "Biro Transport / Alula Express", purpose: "Transportation Fee - Wirtgen Spare Parts (TVP-OFF-036 / CKY203816)", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 6000000, completionDate: excelDate(2026, 8, 21), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-292_BIRO TRANSPORT_ALULA EXPRESS_TRANSPORTATION FEE_21AUG2026", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-293", prfDate: excelDate(2026, 8, 21), mode: "Petty Cash - Zhang Xi Lian", payee: "Expatriate Staff - Office", purpose: "Expatriate Salary - Office, August 2026 (TVP-OFF-037)", category: "Staff Costs", component: "USD component", currency: "USD", amount: 600, completionDate: excelDate(2026, 8, 21), componentStatus: "Cleared", overallStatus: "Completed", folder: "TDSG-2026-08-293_EXPATRIATE SALARY FOR OFFICE AUG'26_21AUG2026", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
  row({ prf: "TDSG-2026-08-294", prfDate: excelDate(2026, 8, 25), mode: "Petty Cash - Li Yang Yang", payee: "Various Conakry Office Suppliers", purpose: "Conakry Office Working Advance - August 2026", category: "Conakry Office Expenses", component: "GNF component", currency: "GNF", amount: 15196889, completionDate: excelDate(2026, 8, 25), componentStatus: "Cleared", overallStatus: "Completed", notes: "Cash ledger, payment voucher TVP-OFF-038 and supporting receipts are present.", folder: "TDSG-2026-08-294_LYY WORKING ADV FOR AUG'26_25AUG2026", expectedReport: "Week 4" }),
  row({ prf: "TDSG-2026-08-295", prfDate: excelDate(2026, 8, 25), mode: "Rouge POB", payee: "Cali / Winning Ocean / Winning Wave", purpose: "DDI, service and customs-clearance charges - multiple shipments", category: "Other Purchase Costs", component: "GNF component", currency: "GNF", amount: 91118428, componentStatus: "Evidence review required", overallStatus: "Evidence review required", dataCheck: "Review - Rouge evidence", notes: "PRF, supplier documents and an email are present; confirm completed Rouge payment evidence/date before Week 4 inclusion.", folder: "TDSG-2026-08-295_PYT ON BEHALF BY ROUGE_CALI,WINNING OCEAN,WINNING WAVE_..._25AUG2026" }),
  row({ prf: "TDSG-2026-08-296", prfDate: excelDate(2026, 8, 25), mode: "Ecobank", payee: "AGRIB Mokatour SARL", purpose: "Local Guinean Salary - Office, August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 13092500, componentStatus: "Pending bank deduction", overallStatus: "Pending", dataCheck: "Pending", notes: "Draft remittance was submitted on 26 August and remained pending approval; no matching deduction through 27 August.", folder: "TDSG-2026-08-296_MOKATOUR_LOCAL GUINEAN SALARY FOR OFFICE_26AUG26" }),
  row({ prf: "TDSG-2026-08-298", prfDate: excelDate(2026, 8, 25), mode: "Ecobank", payee: "Da Run Fa", purpose: "Canteen Purchases - Camp, May to August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 337273000, componentStatus: "Pending bank deduction", overallStatus: "Pending", dataCheck: "Review - amount mismatch", notes: "PRF states GNF 337,273,000; draft remittance states GNF 377,273,000. Resolve before approval/payment.", folder: "TDSG-2026-08-298_DARUNFA CANTEEN PURCHASE FROM MAY'26 TO AUG'26 FOR CAMP_25AUG2026" }),
  row({ prf: "TDSG-2026-08-299", prfDate: excelDate(2026, 8, 25), mode: "Ecobank", payee: "AGRIB Mokatour SARL", purpose: "Local Guinean Salary - Site, August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 663196500, bankCurrency: "GNF", bankAmount: 663196500, bankDate: excelDate(2026, 8, 27), completionDate: excelDate(2026, 8, 27), componentStatus: "Cleared", overallStatus: "Completed", notes: "Ecobank statement shows the exact GNF 663,196,500 deduction on 27 August.", folder: "TDSG-2026-08-299_MOKATOUR_LOCAL GUINEAN SALARY FOR SITE_25AUG2026", expectedReport: "Week 4" }),
  row({ prf: "TDSG-2026-08-300", prfDate: excelDate(2026, 8, 25), mode: "Ecobank", payee: "Hotel Grand Ami SARLU", purpose: "Accommodation and Meal Expenses - June to August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 104840000, componentStatus: "Pending bank deduction", overallStatus: "Pending", dataCheck: "Pending", notes: "Draft remittance submitted 25 August; no matching deduction through 27 August.", folder: "TDSG-2026-08-300_GRAND HOTEL_ACCOMMODATION AND MEAL EXPENSES FROM JUN'25 TO AUG'26_25AUG2026" }),
  row({ prf: "TDSG-2026-08-301", prfDate: excelDate(2026, 8, 25), mode: "Ecobank", payee: "AGRIB Mokatour SARL", purpose: "Milk Allowance - August 2026", category: "Staff Costs", component: "GNF component", currency: "GNF", amount: 14700000, componentStatus: "Pending bank deduction", overallStatus: "Pending", dataCheck: "Pending", notes: "Draft remittance submitted 25 August; no matching deduction through 27 August.", folder: "TDSG-2026-08-301_ALLOWANCE OF MILK FOR AUG'26_25AUG2026" }),
  row({ prf: "TDSG/CHN-2026-40", prfDate: excelDate(2026, 8, 6), source: "China", mode: "OCBC", payee: "Far Sight Logistic Pte. Ltd.", purpose: "Freight - MV Winning Rich (FS26-3197)", category: "Other Purchase Costs", component: "USD component", currency: "USD", amount: 7500, bankCurrency: "USD", bankAmount: 7500, bankDate: excelDate(2026, 8, 14), completionDate: excelDate(2026, 8, 14), componentStatus: "Cleared", overallStatus: "Completed", notes: "OCBC statement matched client reference FS26-3197.", folder: "TDSG-CHN-2026-40", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG/CHN-2026-41", prfDate: excelDate(2026, 8, 13), source: "China", mode: "OCBC", payee: "PICC Property and Casualty Company Limited - Qingdao Branch", purpose: "Insurance Fee", category: "Other Purchase Costs", component: "USD component", currency: "USD", amount: 1898.22, bankCurrency: "USD", bankAmount: 1898.22, bankDate: excelDate(2026, 8, 14), completionDate: excelDate(2026, 8, 14), componentStatus: "Cleared", overallStatus: "Completed", dataCheck: "Review - PRF identifier", notes: "Source payment request and OCBC reference show TGM/CHN/2026-41; HTML uses TDSG/CHN-2026-41.", folder: "TDSG-CHN-2026-41", expectedReport: "Week 2", captured: "Yes", htmlReport: "Week 2" }),
  row({ prf: "TDSG/CHN-2026-42", prfDate: excelDate(2026, 8, 13), source: "China", mode: "OCBC", payee: "Wirtgen Hong Kong Limited", purpose: "Purchase Wirtgen 280SM Spare Parts (WHK-TOP-2026-005 / HP2026-005)", category: "Machine parts and other supplies", component: "EUR component", currency: "EUR", amount: 114253.30, bankCurrency: "USD", bankAmount: 132470.99, bankDate: excelDate(2026, 8, 19), completionDate: excelDate(2026, 8, 19), componentStatus: "Cleared", overallStatus: "Completed", notes: "OCBC statement matched TDSG/CHN-2026-42; bank debit was USD 132,470.99 plus charges.", folder: "TDSG-CHN-2026-42", expectedReport: "Week 3", captured: "Yes", htmlReport: "Week 3" }),
];

async function htmlPayments() {
  const files = (await fs.readdir(reportDirectory))
    .filter((name) => name.toLowerCase().endsWith(".html"))
    .sort();
  const rows = [];
  for (const file of files) {
    const source = await fs.readFile(path.join(reportDirectory, file), "utf8");
    const week = /Report_Week(\d)/i.exec(file)?.[1] || "";
    for (const match of source.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)) {
      if (/class=["']tot["']/.test(match[0])) continue;
      const cells = Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), (cell) => plainText(cell[1]));
      if (cells.length !== 10 || !/^(?:TDSG|TGM)/.test(cells[1])) continue;
      rows.push({
        no: cells[0],
        prf: normalizePrf(cells[1]),
        paymentDate: cells[2],
        mode: cells[3],
        payee: cells[4],
        purpose: cells[5],
        category: cells[6],
        originalAmount: cells[7],
        usd: Number(cells[8].replace(/,/g, "")) || 0,
        rate: cells[9],
        report: `Week ${week}`,
        file,
      });
    }
  }
  return rows;
}

function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

function styleTitle(sheet, range, title) {
  range.merge();
  range.values = [[title]];
  range.format = {
    fill: "#17365D",
    font: { name: "Aptos Display", size: 18, bold: true, color: "#FFFFFF" },
    verticalAlignment: "center",
  };
  range.format.rowHeight = 32;
}

function styleHeader(range) {
  range.format = {
    fill: "#1F4E78",
    font: { name: "Aptos", size: 10, bold: true, color: "#FFFFFF" },
    verticalAlignment: "center",
    horizontalAlignment: "left",
    wrapText: true,
    borders: { bottom: { style: "medium", color: "#17365D" } },
  };
  range.format.rowHeight = 30;
}

const htmlRows = await htmlPayments();
validateSourceData(htmlRows);
const augustPrfs = new Set(register.map((item) => normalizePrf(item.prf)));
const workbook = Workbook.create();
const actions = workbook.worksheets.add("Action Required");
const summary = workbook.worksheets.add("Summary");
const combined = workbook.worksheets.add("Combined Register");
const sources = workbook.worksheets.add("Sources & Checks");

for (const sheet of [actions, summary, combined, sources]) {
  sheet.showGridLines = false;
}

// Action Required - intentionally first so unresolved items are visible on opening.
styleTitle(actions, actions.getRange("A1:H1"), "Action Required - August 2026 PRF Control");
actions.getRange("A2:H2").merge();
actions.getRange("A2").values = [["Open verification and follow-up items as of 27 August 2026. Use the filters to focus by priority, status or PRF."]];
actions.getRange("A2:H2").format = { font: { name: "Aptos", size: 10, italic: true, color: "#44546A" }, verticalAlignment: "center" };
actions.getRange("A4:H4").values = [["Priority", "PRF No.", "Issue", "Required Follow-up", "Status", "Next Check / Due", "Amount / Reference", "Evidence / Note"]];
styleHeader(actions.getRange("A4:H4"));
const actionRows = [
  ["Critical", "TDSG-2026-08-298", "Amount mismatch", "Confirm the correct payable amount before approving or releasing payment.", "Open", "Before payment", "PRF GNF 337,273,000; draft GNF 377,273,000", "GNF 40,000,000 discrepancy."],
  ["High", "TDSG-2026-08-285", "USD component not cleared", "Check the bank statement and retain in the pending register until the USD deduction is confirmed.", "Open", "Next bank statement", "USD 50,000", "GNF 400,000,000 component was cleared on 14 August."],
  ["High", "TDSG-2026-08-288", "Bank deduction outstanding", "Check Ecobank for the exact debit; include in HTML only after deduction is confirmed.", "Open", "Next bank statement", "GNF 690,223,394", "Pending register and statements reviewed through 27 August."],
  ["High", "TDSG-2026-08-295", "Rouge completion evidence", "Confirm completed Rouge POB evidence and the actual payment date before Week 4 inclusion.", "Open", "Before Week 4 report", "GNF 91,118,428", "PRF, supplier documents and email are present; completion was not independently confirmed."],
  ["Medium", "TDSG-2026-08-296", "Bank deduction outstanding", "Check Ecobank for the exact debit and update the bank-clearance date.", "Open", "Next bank statement", "GNF 13,092,500", "Draft remittance remained pending approval."],
  ["Medium", "TDSG-2026-08-300", "Bank deduction outstanding", "Check Ecobank for the exact debit and update the bank-clearance date.", "Open", "Next bank statement", "GNF 104,840,000", "Draft remittance only through 27 August."],
  ["Medium", "TDSG-2026-08-301", "Bank deduction outstanding", "Check Ecobank for the exact debit and update the bank-clearance date.", "Open", "Next bank statement", "GNF 14,700,000", "Draft remittance only through 27 August."],
  ["Medium", "TDSG/CHN-2026-41", "PRF identifier mismatch", "Confirm whether the correct reference is TGM/CHN/2026-41 or TDSG/CHN-2026-41 and align future records.", "Open", "Before final monthly close", "USD 1,898.22", "Source form and OCBC reference use TGM; HTML uses TDSG."],
  ["Low", "PRF 297", "Sequence gap", "Confirm whether PRF 297 was intentionally skipped or is stored outside the August folders.", "Open", "Before final monthly close", "No folder found", "Do not assume a missing payment without a source document."],
];
actions.getRangeByIndexes(4, 0, actionRows.length, 8).values = actionRows;
const actionEnd = actionRows.length + 4;
actions.getRange(`A5:H${actionEnd}`).format = { font: { name: "Aptos", size: 10 }, verticalAlignment: "center", wrapText: true, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
actions.getRange(`E5:E${actionEnd}`).dataValidation = { rule: { type: "list", values: ["Open", "Waiting", "Completed"] } };
actions.getRange(`A5:H${actionEnd}`).conditionalFormats.addCustom('=$A5="Critical"', { fill: "#FFC7CE", font: { bold: true } });
actions.getRange(`A5:H${actionEnd}`).conditionalFormats.addCustom('=$A5="High"', { fill: "#FCE4D6", font: { bold: true } });
actions.getRange(`A5:H${actionEnd}`).conditionalFormats.addCustom('=$A5="Medium"', { fill: "#FFF2CC" });
actions.getRange(`A5:H${actionEnd}`).conditionalFormats.addCustom('=$A5="Low"', { fill: "#F2F2F2" });
const actionTable = actions.tables.add(`A4:H${actionEnd}`, true, "ActionRequired");
actionTable.style = "TableStyleLight2";
actionTable.showFilterButton = true;
actions.freezePanes.freezeRows(4);
actions.freezePanes.freezeColumns(2);
setColumnWidths(actions, [12, 20, 24, 55, 13, 22, 31, 55]);

// Combined PRF, bank-clearance and HTML reconciliation register.
const capturedPrfs = new Set();
const augustRows = register.map((item) => {
  const normalized = normalizePrf(item.prf);
  const htmlRowFlag = item.captured === "Yes" && !capturedPrfs.has(normalized) ? 1 : 0;
  if (item.captured === "Yes") capturedPrfs.add(normalized);
  return {
    scope: "August PRF raised",
    ...item,
    htmlRowFlag,
    sourceRef: item.folder,
  };
});
const priorMonthRows = htmlRows
  .filter((item) => !augustPrfs.has(item.prf))
  .map((item) => {
    const [day, month, year] = item.paymentDate.split("/").map(Number);
    const paymentDate = excelDate(year, month, day);
    const currency = /^(GNF|USD|EUR)/.exec(item.originalAmount)?.[1] || "";
    const originalAmount = Number((item.originalAmount.match(/[\d,.]+/)?.[0] || "0").replace(/,/g, ""));
    const bankMode = ["OCBC", "Ecobank"].includes(item.mode);
    return {
      scope: "Prior-month PRF paid in August",
      prf: item.prf,
      prfDate: null,
      source: item.prf.includes("/CHN-") ? "China" : "Guinea",
      mode: item.mode,
      payee: item.payee,
      purpose: item.purpose,
      category: item.category,
      component: `${currency || "Original"} component`,
      currency,
      amount: originalAmount,
      bankCurrency: bankMode ? currency : null,
      bankAmount: bankMode ? originalAmount : null,
      bankDate: bankMode ? paymentDate : null,
      completionDate: paymentDate,
      componentStatus: "Cleared",
      overallStatus: "Completed",
      expectedReport: item.report,
      captured: "Yes",
      htmlReport: item.report,
      dataCheck: "OK",
      notes: "PRF was raised before August and paid during August.",
      sourceRef: item.file,
      countFlag: 0,
      htmlRowFlag: 1,
    };
  });
const combinedRows = [...augustRows, ...priorMonthRows];
styleTitle(combined, combined.getRange("A1:Z1"), "Combined PRF, Bank Clearance & HTML Register - August 2026");
combined.getRange("A2:Z2").merge();
combined.getRange("A2").values = [["One filterable list covering August-raised PRFs, bank/payment evidence, HTML capture, and prior-month PRFs paid in August. As of 27 August 2026."]];
combined.getRange("A2:Z2").format = { font: { name: "Aptos", size: 10, italic: true, color: "#44546A" }, verticalAlignment: "center" };
combined.getRange("A4:Z4").values = [[
  "Scope", "PRF No.", "PRF Date", "Source", "Payment Mode", "Payee / Supplier", "Purpose", "Category", "Component",
  "Original Currency", "Original Amount", "Bank Currency", "Bank Deducted Amount", "Bank Clearance Date", "Payment Completion Date",
  "Component Status", "Overall PRF Status", "Expected HTML Report", "HTML Captured?", "Actual HTML Report", "HTML Check",
  "Data Check", "Notes", "Source Folder / Report File", "PRF Count Flag", "HTML Row Count Flag",
]];
styleHeader(combined.getRange("A4:Z4"));
const combinedValues = combinedRows.map((item) => [
  item.scope, item.prf, item.prfDate, item.source, item.mode, item.payee, item.purpose, item.category, item.component,
  item.currency, item.amount, item.bankCurrency, item.bankAmount, item.bankDate, item.completionDate,
  item.componentStatus, item.overallStatus, item.expectedReport, item.captured, item.htmlReport, null,
  item.dataCheck, item.notes, item.sourceRef, item.countFlag, item.htmlRowFlag,
]);
combined.getRangeByIndexes(4, 0, combinedValues.length, 26).values = combinedValues;
const registerEnd = combinedValues.length + 4;
for (let index = 0; index < combinedRows.length; index += 1) {
  const excelRow = index + 5;
  combined.getRange(`U${excelRow}`).formulas = [[
    `=IF(P${excelRow}="Pending bank deduction",IF(S${excelRow}="No","Correctly excluded","Review"),IF(P${excelRow}="Evidence review required",IF(S${excelRow}="No","Awaiting evidence","Review"),IF(R${excelRow}="Week 4",IF(S${excelRow}="No","Week 4 report pending","OK"),IF(S${excelRow}="Yes","OK","Missing from HTML"))))`,
  ]];
  combined.getRange(`K${excelRow}`).format.numberFormat = combinedRows[index].currency === "GNF" ? "#,##0" : "#,##0.00";
  combined.getRange(`M${excelRow}`).format.numberFormat = combinedRows[index].bankCurrency === "GNF" ? "#,##0" : "#,##0.00";
}
combined.getRange(`A5:Z${registerEnd}`).format = { font: { name: "Aptos", size: 10 }, verticalAlignment: "center", wrapText: true, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
combined.getRange(`C5:C${registerEnd}`).format.numberFormat = "dd-mmm-yyyy";
combined.getRange(`N5:O${registerEnd}`).format.numberFormat = "dd-mmm-yyyy";
combined.getRange(`K5:M${registerEnd}`).format.horizontalAlignment = "right";
combined.getRange(`Y5:Z${registerEnd}`).format.numberFormat = "0";
const combinedDataRange = combined.getRange(`A5:Z${registerEnd}`);
combinedDataRange.conditionalFormats.addCustom(
  '=OR($U5="Missing from HTML",$V5="Review - Rouge evidence",$V5="Review - amount mismatch",$V5="Review - PRF identifier")',
  { fill: "#FFC7CE", font: { bold: true } },
);
combinedDataRange.conditionalFormats.addCustom(
  '=OR($P5="Pending bank deduction",$P5="Evidence review required",$U5="Week 4 report pending")',
  { fill: "#FFF2CC" },
);
combinedDataRange.conditionalFormats.addCustom('=$A5="Prior-month PRF paid in August"', { fill: "#F2F2F2" });
const combinedTable = combined.tables.add(`A4:Z${registerEnd}`, true, "CombinedPrfHtmlRegister");
combinedTable.style = "TableStyleLight2";
combinedTable.showFilterButton = true;
// Keep normal register rows plain white; conditional formatting supplies the only attention colours.
combined.getRange(`A5:Z${registerEnd}`).format.fill = "#FFFFFF";
combined.freezePanes.freezeRows(4);
combined.freezePanes.freezeColumns(2);
setColumnWidths(combined, [25, 20, 12, 9, 28, 31, 47, 23, 16, 14, 15, 13, 18, 15, 17, 21, 21, 17, 14, 16, 22, 24, 58, 55, 12, 15]);

// Sources and control notes
styleTitle(sources, sources.getRange("A1:F1"), "Sources and Control Checks");
sources.getRange("A3:F3").values = [["Source Type", "Period / As-of", "Source Name", "Location / Reference", "Use", "Result / Note"]];
styleHeader(sources.getRange("A3:F3"));
const sourceRows = [
  ["PRF folders", "August 2026", "TDSG Guinea and China Payment Request folders", "Payment Request\\TDSG GUINEA\\2026\\08.AUG2026 and Payment Request\\TDSG CHINA\\2026", "Population, PRF date, payee, purpose, amount, payment mode", "26 August-raised PRFs identified; PRF 297 is not present."],
  ["Pending register", "Through 23-Aug-2026", "TDSG Online Payments Pending Bank Deduction_13Jul-23Aug2026.xlsx", "Weekly Payment Approval Lists\\2026\\08.AUG2026", "Known undeducted online payments", "PRF 285 USD component and PRF 288 were pending."],
  ["Ecobank statement", "01-27 Aug 2026", "01AUG - 27AUG.pdf (GNF)", "Cash & Bank Records\\Bank Statement\\2026\\2026 ECOBANK Bank Statement - GNF\\08.AUG2026", "Posting/value dates and bank deductions", "Matched PRFs 282, 285 GNF component and 299."],
  ["Ecobank statement", "01-27 Aug 2026", "01AUG to 27AUG.pdf (USD)", "Cash & Bank Records\\Bank Statement\\2026\\2026 ECOBANK Bank Statement - USD\\08.AUG2026", "USD bank deductions", "No USD withdrawals."],
  ["OCBC statement", "29 Jul-27 Aug 2026", "01AUG to 12AUG.pdf and 01AUG to 27AUG.pdf", "Cash & Bank Records\\Bank Statement\\2026\\2026 OCBC Bank Statement - USD\\08.AUGUST2026", "Posting/value dates and bank deductions", "Matched China PRFs 37/38/39/40/41/42; 37-39 were raised in July."],
  ["Weekly HTML", "Weeks 1-3 through 23-Aug-2026", "Three August weekly HTML reports", "Weekly Payment Approval Lists\\2026\\08.AUG2026", "Payment-detail completeness", `${htmlRows.length} payment rows extracted; 7 are prior-month PRFs paid in August.`],
];
sources.getRangeByIndexes(3, 0, sourceRows.length, 6).values = sourceRows;
sources.getRange(`A4:F${sourceRows.length + 3}`).format = { font: { name: "Aptos", size: 10 }, verticalAlignment: "center", wrapText: true, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
sources.getRange("A12:C12").values = [["Control", "Result", "Interpretation"]];
styleHeader(sources.getRange("A12:C12"));
sources.getRange("A13:C16").values = [
  ["MODEL STATUS", null, "PASS only when current HTML has no missing due items and unresolved source exceptions are disclosed."],
  ["Missing due HTML items", null, "Expected Weeks 1-3 items absent from HTML."],
  ["Unresolved source exceptions", null, "PRF/document discrepancies requiring follow-up."],
  ["Bank evidence cutoff", asOfDate, "Statements reviewed through this date."],
];
sources.getRange("B13").formulas = [["=IF(B14=0,IF(B15=0,\"PASS\",\"PASS WITH DISCLOSED EXCEPTIONS\"),\"REVIEW\")"]];
sources.getRange("B14").formulas = [[`=COUNTIF('Combined Register'!$U$5:$U$${registerEnd},"Missing from HTML")`]];
sources.getRange("B15").formulas = [[`=COUNTIF('Combined Register'!$V$5:$V$${registerEnd},"Review - Rouge evidence")+COUNTIF('Combined Register'!$V$5:$V$${registerEnd},"Review - amount mismatch")+COUNTIF('Combined Register'!$V$5:$V$${registerEnd},"Review - PRF identifier")`]];
sources.getRange("B16").format.numberFormat = "dd-mmm-yyyy";
sources.getRange("A13:C16").format = { font: { name: "Aptos", size: 10 }, verticalAlignment: "center", wrapText: true, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
sources.getRange("A13:C13").format = { fill: "#E2F0D9", font: { name: "Aptos", size: 10, bold: true, color: "#375623" } };
const sourcesTable = sources.tables.add(`A3:F${sourceRows.length + 3}`, true, "ControlSources");
sourcesTable.style = "TableStyleMedium2";
sourcesTable.showFilterButton = true;
sources.freezePanes.freezeRows(3);
setColumnWidths(sources, [24, 24, 48, 66, 40, 62]);

// Summary
styleTitle(summary, summary.getRange("A1:H1"), "TDSG August 2026 PRF Clearance & HTML Control");
summary.getRange("A2:H2").merge();
summary.getRange("A2").values = [["As of 27 August 2026 · All August-raised PRFs · Bank statements, payment evidence and weekly HTML reconciled"]];
summary.getRange("A2:H2").format = { font: { name: "Aptos", size: 10, italic: true, color: "#44546A" }, verticalAlignment: "center" };
summary.getRange("A4:B4").values = [["Population", "Count"]];
styleHeader(summary.getRange("A4:B4"));
summary.getRange("A5:A10").values = [["PRFs raised"], ["Fully completed PRFs"], ["Partially completed PRFs"], ["Pending PRFs"], ["Evidence review required"], ["Payment components"]];
summary.getRange("B5:B10").formulas = [
  [`=SUM('Combined Register'!$Y$5:$Y$${registerEnd})`],
  [`=SUMIFS('Combined Register'!$Y$5:$Y$${registerEnd},'Combined Register'!$Q$5:$Q$${registerEnd},"Completed")`],
  [`=SUMIFS('Combined Register'!$Y$5:$Y$${registerEnd},'Combined Register'!$Q$5:$Q$${registerEnd},"Partially completed")`],
  [`=SUMIFS('Combined Register'!$Y$5:$Y$${registerEnd},'Combined Register'!$Q$5:$Q$${registerEnd},"Pending")`],
  [`=SUMIFS('Combined Register'!$Y$5:$Y$${registerEnd},'Combined Register'!$Q$5:$Q$${registerEnd},"Evidence review required")`],
  [`=COUNTIF('Combined Register'!$A$5:$A$${registerEnd},"August PRF raised")`],
];
summary.getRange("D4:E4").values = [["HTML Control", "Count"]];
styleHeader(summary.getRange("D4:E4"));
summary.getRange("D5:D10").values = [["Current HTML payment rows"], ["August-raised PRFs captured"], ["Prior-month PRFs paid in August"], ["Missing due HTML items"], ["Week 4 items awaiting report"], ["Open follow-up items"]];
summary.getRange("E5:E10").formulas = [
  [`=SUM('Combined Register'!$Z$5:$Z$${registerEnd})`],
  [`=SUMIFS('Combined Register'!$Y$5:$Y$${registerEnd},'Combined Register'!$A$5:$A$${registerEnd},"August PRF raised",'Combined Register'!$S$5:$S$${registerEnd},"Yes")`],
  [`=COUNTIF('Combined Register'!$A$5:$A$${registerEnd},"Prior-month PRF paid in August")`],
  [`=COUNTIF('Combined Register'!$U$5:$U$${registerEnd},"Missing from HTML")`],
  [`=COUNTIF('Combined Register'!$U$5:$U$${registerEnd},"Week 4 report pending")`],
  [`=COUNTIF('Action Required'!$E$5:$E$${actionEnd},"<>Completed")`],
];
summary.getRange("A12:H12").merge();
summary.getRange("A12").values = [["Items requiring attention"]];
summary.getRange("A12:H12").format = { fill: "#D9E2F3", font: { name: "Aptos", size: 12, bold: true, color: "#17365D" } };
summary.getRange("A13:H16").values = [
  ["PRF 298", "Amount mismatch", null, "PRF: GNF 337,273,000", "Draft remittance: GNF 377,273,000", "Resolve before payment", null, null],
  ["China PRF 41", "Identifier mismatch", null, "Source form: TGM/CHN/2026-41", "HTML: TDSG/CHN-2026-41", "Confirm correct entity/reference", null, null],
  ["PRF 295", "Evidence review", null, "Rouge POB support is present", "Completed-payment date not independently confirmed", "Confirm before Week 4 inclusion", null, null],
  ["PRF 297", "Sequence gap", null, "No August PRF folder found", "Not assumed to be missing without a source document", "Confirm whether number was intentionally skipped", null, null],
];
summary.getRange("A13:H16").format = { font: { name: "Aptos", size: 10 }, verticalAlignment: "center", wrapText: true, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
summary.getRange("A18:H18").merge();
summary.getRange("A18").values = [["Interpretation: weekly HTML reports include completed payments, not every approved PRF. Pending bank deductions must remain excluded until the bank statement confirms the deduction."]];
summary.getRange("A18:H18").format = { fill: "#FFF2CC", font: { name: "Aptos", size: 10, italic: true, color: "#7F6000" }, wrapText: true };
summary.getRange("A5:B10").format = { font: { name: "Aptos", size: 11 }, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
summary.getRange("D5:E10").format = { font: { name: "Aptos", size: 11 }, borders: { insideHorizontal: { style: "thin", color: "#D9E2F3" } } };
summary.getRange("B5:B10").format = { fill: "#EAF2F8", font: { name: "Aptos Display", size: 14, bold: true, color: "#17365D" }, horizontalAlignment: "center" };
summary.getRange("E5:E10").format = { fill: "#EAF2F8", font: { name: "Aptos Display", size: 14, bold: true, color: "#17365D" }, horizontalAlignment: "center" };
summary.freezePanes.freezeRows(2);
setColumnWidths(summary, [23, 14, 3, 30, 38, 30, 4, 4]);
summary.getRange("A18:H18").format.rowHeight = 42;
summary.getRange("A13:H16").format.rowHeight = 36;

// Compact verification output and visual previews.
await prepareOutputDirectory();
const summaryInspect = await workbook.inspect({ kind: "table", range: "Summary!A1:H18", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 10 });
console.log(summaryInspect.ndjson);
const errorScan = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 200 }, summary: "final formula error scan" });
console.log(errorScan.ndjson);

for (const [sheetName, range] of [
  ["Action Required", `A1:H${actionEnd}`],
  ["Summary", "A1:H18"],
  ["Combined Register", `A1:Z${registerEnd}`],
  ["Sources & Checks", "A1:F16"],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDirectory, `${sheetName.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Created ${outputPath}`);
