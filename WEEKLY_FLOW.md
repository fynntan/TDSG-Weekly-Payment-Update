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

### Month-end dependency: run TGM before publishing

When the reporting Monday–Sunday includes a calendar month's final day, complete
that month's TGM workflow before releasing the combined weekly URL. Use
[TGM-Monthly-Payment-](https://github.com/fynntan/TGM-Monthly-Payment-)'s current
AGENTS.md, README.md, PROJECT_MEMORY.md and MONTHLY_CHECKLIST.md. TGM remains a
separate workflow and source repository; this weekly flow coordinates the
dependency. Do not apply TDSG's Rouge rules to TGM.

1. Save every `requiredTgmMonths` returned by the planner in the private checkpoint
   before doing work. Preserve unresolved requirements across weeks. The planner
   also catches intervening month ends after the prior checkpoint, so a skipped
   holiday Monday or interrupted run does not lose the month-end requirement.
2. Locate the applicable TGM Finance monthly folder. Reuse an already prepared
   month's files only after verifying the exact month, source coverage and
   reconciliation. Otherwise prepare the complete TGM monthly HTML and PRF/bank/HTML
   reconciliation workbook under the TGM workflow. Reopen and verify Finance's
   saved files. Record their normalized HTML SHA-256 and workbook SHA-256 privately.
3. Preserve existing TDSG/TGM history while incorporating the newly completed
   TGM calendar month into the combined viewer. A weekly TDSG HTML alone is not
   the complete month-end release. Before publishing, run:
   `npm run flow:verify-viewer -- <combined-viewer.html> <private-checkpoint.json>`.
   It rejects a missing/duplicate month, wrong company/month, incomplete workbook
   evidence, or monthly HTML differing from the verified Finance copy.
4. Save the verifier's `monthlyReports` result and viewer SHA in the checkpoint.
   Publish only after all required months pass, then verify the same live viewer
   hash and its TGM month entries before sending the single combined URL to the
   existing recipients. Reuse unchanged verified monthly reports; do not create a
   separate duplicate monthly notification or another scheduler.
5. If required TGM documents or month-end bank coverage are missing, retain the
   prepared work privately and send the specific TGM missing-items list through
   both existing routes. Do not describe a viewer missing a required month as
   complete. Noon recovery resumes this dependency as well as weekly work.

Example: the week 30 November–6 December 2026 includes 30 November. Its Monday
7 December run must complete and incorporate TGM November before releasing the
weekly URL. The 23–29 November reporting week does not trigger November yet.

### Weekly evidence gates

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
  "periodStart": "2026-11-23",
  "requiredTgmMonths": [],
  "monthlyReports": {},
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

For each required TGM month, `monthlyReports["YYYY-MM"]` must contain
`verified: true`, `financeSynced: true`, `reportSha256`, `workbookSha256`, and
`viewerSha256` from the viewer verifier. The final `viewerSha256` must match the
checkpoint's published `sha256`. A prior viewer's monthly proof cannot complete
a replacement release; verify inclusion again without rerunning unchanged source
work. The planner refuses `already_completed` while a required month lacks this
proof, even if the weekly HTML and both WhatsApp sends succeeded.

For an incomplete run, save `result: "missing"`, the specific blockers, available
artifacts, exact message fingerprints, per-route receipts and any uncertain send
IDs. Send the formatted missing-items notice at the primary run. At noon, recheck
only the unresolved work, finish any recoverable stages, and send the completed
report link if it becomes ready. Never resend an unchanged missing-items notice
or a previously successful route. If recovery finds no material change, save its
check result and stop quietly. If a send is uncertain, query its existing status
before retrying with the same persistent ID. Report a new failure or changed
blocker with its actual evidence; never call a partial result complete.

WhatsApp reports contain recipient-facing financial highlights or specific missing
items, with an empty line between every bullet. Follow WHATSAPP_NOTIFICATIONS.md;
keep attribution/formatting repairs, Codex replies, Git/tests/deployment and schedule
implementation updates in this chat, not in recipient report notifications.
