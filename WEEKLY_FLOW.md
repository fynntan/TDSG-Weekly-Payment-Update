# Weekly report and recovery

Run at 11 am on Singapore working Mondays for the previous ISO Monday–Sunday.
The same app automation wakes again at noon, one hour later, for recovery. Both
occurrences use the same report period, checkpoint, source cache and send receipts.
Skip both occurrences on Singapore public-holiday Mondays. The app owns the
scheduler; GitHub Actions validates source changes and does not run this job.

## Before either occurrence

1. Read AGENTS.md, PROJECT_MEMORY.md and README.md. Check the current official MOM
   holiday calendar and save it privately as `output/weekly-flow/singapore-calendar.json`:
   `{ "year": 2026, "holidays": ["2026-01-01"], "source": "https://www.mom.gov.sg/..." }`.
   Include the complete year's gazetted and observed holiday dates. The example
   contains only one illustrative date. Never use it as the full calendar.
2. Run `npm run flow:plan`. A missing or wrong-year calendar blocks eligibility
   until verified; do not assume an unknown day is a working day.
3. Stop for `not_due`, `skip_public_holiday`, `already_completed` or
   `run_in_progress`. A recovery must not restart a completed report or duplicate
   its notification. For `start` or `resume_incomplete`, inspect the saved work and
   uncertain send IDs before accessing sources or sending anything.
4. Save the period and a bounded `leaseUntil` in the private checkpoint before
   starting. Preserve prior receipts and resumable work. Clear the lease when
   finished, or let it expire after an interrupted run; do not leave an unbounded
   in-progress marker.

## Report, workbook and evidence gates

Follow README.md's full intake, reconciliation, HTML, workbook, Finance-sync and
publication flow. Reuse verified unchanged sources, and refresh missing or changed
items. Retain the stated cutoff even when records arrive later.

- Rouge POB accepts matching supporting copies returned signed and stamped by
  Venus, as in Week 45 PRFs 365/366. A TDSG bank debit is not required. Use
  `rougeRecognition` from `scripts/payment-policy.mjs` to determine eligibility
  and week; it requires signed/stamped support and resolved duplicate costs. Keep
  independently established completion dates, otherwise use the confirmation
  date in Singapore time. Never classify that date as a verified bank debit.
- Bank payments require actual statement deductions. Remittance authorisation
  is not clearance. Keep each account's coverage and cutoff explicit.
- Read document contents and reconcile supporting schedules, not just filenames,
  subject lines or old email summaries. Record resolved differences. PRF 390's
  payroll schedule totals GNF 849,737,500, despite its earlier email summary.
- Reused PRF identifiers and invoice revisions require component-level matching.
  Previously reported amounts must not be counted again.
- `npm run check` rejects attribution other than
  `Prepared by Fynn Tan · Reviewed by Venus Tham`, alongside existing report,
  template, financial reconciliation and notification checks.
- Update the weekly Excel, rolling pending-bank register and affected existing
  reconciliation controls. The August-specific builder must not be run unchanged
  for another month. Check formulas and saved totals; synchronize Finance copies.

## Private checkpoint and recovery

Use `output/weekly-flow/checkpoint.json`. Keep this file, the holiday calendar,
recipient configuration, token URLs and receipts out of Git. Write updates via a
temporary file followed by rename to avoid a truncated checkpoint on interruption.

After a fully verified publication and both route sends, retain this structure:

```json
{
  "periodEnd": "2026-11-29",
  "result": "report",
  "verified": true,
  "financeSynced": true,
  "url": "https://venus.milolab.io/EXAMPLE/",
  "sha256": "REPLACE_WITH_VERIFIED_64_CHARACTER_SHA256",
  "version": "EXACT_REPORT_VERSION",
  "deliveries": {
    "venus": { "status": "sent", "version": "EXACT_REPORT_VERSION", "receiptPath": "PRIVATE_RECEIPT_PATH" },
    "fynn": { "status": "sent", "version": "EXACT_REPORT_VERSION", "receiptPath": "PRIVATE_RECEIPT_PATH" }
  }
}
```

Only set `verified` and `financeSynced` after their checks succeed. Receipt status
must reflect observed evidence: accepted/sent does not mean delivered/read. The
planner does not independently audit a checkpoint's claims; preserve its supporting
files and verify them before recording completion. An incomplete route prevents
`already_completed`, even when the other route succeeded.

For an incomplete run, save `result: "missing"`, the specific blockers, available
artifacts, exact message fingerprints, per-route receipts and any uncertain send
IDs. Send the formatted missing-items notice at the primary run. At noon, recheck
only the unresolved work, finish any recoverable stages, and send the completed
report link if it becomes ready. Never resend an unchanged missing-items notice
or a previously successful route. If recovery finds no material change, save its
check result and stop quietly. If a send is uncertain, query its existing status
before retrying with the same persistent ID. Report a new failure or changed
blocker with its actual evidence; never call a partial result complete.
