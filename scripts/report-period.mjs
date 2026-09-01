const monthNumbers = new Map(
  [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].map((month, index) => [month, index]),
);

function decodedText(source) {
  return String(source)
    .replace(/<[^>]+>/g, " ")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&middot;|&#183;/gi, "·")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeUtcDate(yearText, monthText, dayText) {
  const month = monthNumbers.get(monthText.toLowerCase());
  const year = Number(yearText);
  const day = Number(dayText);
  if (month === undefined || !Number.isInteger(year) || !Number.isInteger(day)) return null;
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
    ? date
    : null;
}

export function reportEndDate(source) {
  const text = decodedText(source);
  const crossMonth = /\b\d{1,2}\s+([A-Za-z]+)\s*[–—-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/.exec(text);
  if (crossMonth) return makeUtcDate(crossMonth[4], crossMonth[3], crossMonth[2]);

  const sameMonth = /\b\d{1,2}\s*[–—-]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/.exec(text);
  if (sameMonth) return makeUtcDate(sameMonth[3], sameMonth[2], sameMonth[1]);

  return null;
}

export function isoWeekNumber(date) {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    throw new TypeError("A valid report end date is required to calculate the ISO week.");
  }
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
}

export function reportIsoWeek(source) {
  const endDate = reportEndDate(source);
  if (!endDate) throw new Error("Could not determine the report end date from the report date range.");
  return isoWeekNumber(endDate);
}

export function normalizeReportWeek(source, week = reportIsoWeek(source)) {
  return String(source)
    .replace(
      /(TDSG Weekly Payment Report\s*(?:&mdash;|&#8212;|—|-)\s*)Week\s*\d+/gi,
      `$1Week ${week}`,
    )
    .replace(
      /(Weekly Payment Report\s*(?:&middot;|&#183;|·)\s*)Week\s*\d+/gi,
      `$1Week ${week}`,
    );
}

export function filenameWeek(filename) {
  const match = /_Week(\d+)_/i.exec(filename);
  return match ? Number(match[1]) : null;
}
