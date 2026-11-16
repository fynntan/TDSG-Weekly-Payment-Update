# TDSG Weekly Payment Reports

This repository contains the reviewed weekly payment reports and the reusable presentation standard for **TOP DEVELOPMENT SERVICES GUINEA SARLU**.

## Scheduled report and delivery

The weekly task runs on **Tuesday at 10:00 am Asia/Singapore (GMT+8)** for the
previous ISO week's Monday through Sunday. Tuesday is the run date, not part of
the reporting period. After a schedule change, verify the actual next scheduled
timestamp in Singapore time; an enabled task or a recurrence string alone does
not prove the timing is correct.

Each run must produce one of these outcomes for both privately configured
WhatsApp routes:

- **Complete:** prepare and verify the report, synchronize Finance's monthly
  copy, publish a new weekly URL, verify the release and retired links, then send
  the new URL with its reporting period. Send no HTML or source-file attachments.
- **Incomplete:** save the work privately and send a specific missing-items list.
  Identify the affected PRF or account, dates not covered, conflicting fields,
  sources already checked, and the document or confirmation needed. Distinguish
  missing evidence from an expired login or an unavailable service. Do not
  publish a partial report as complete or send an old URL as this week's report.

Verify the exact sender account and recipient number separately for each route.
Never substitute another sender. If one route fails, complete the available
route and report each route's actual status in the task chat. Retain private
message receipts and deduplicate by period, result type, content/version, sender,
and recipient. A missing-items notice must not suppress a later completed-report
link. Query uncertain send results before retrying.

Routing details and operational evidence belong under ignored `input/` or
`output/`, never in this public repository. The app owns the live automation;
this README records its operating rules, not a second scheduler.

## Create the next weekly report

1. Prepare the weekly payment Excel and new report HTML from the source evidence listed under **Source documents and folders** below. Use an existing weekly list when available; otherwise compile it from the underlying evidence. The lack of a pre-made list alone is not a missing external document. Do not derive the transaction list only from an earlier HTML report or treat the compiled Excel as independent proof of payment.
2. From the repository root, run the single preparation command:

   ```powershell
   npm run report:prepare -- "path\to\input-report.html" "reports\YYYY-MM\output-report.html"
   ```

   This detects the old or current report format, applies the latest shared templates, saves the result below `reports/`, and runs all automated checks. Do not copy an earlier report's embedded CSS or JavaScript manually.

3. Run the automated checks:

   ```powershell
   npm run check
   ```

   GitHub Actions runs the same check automatically on every push and pull request. The check also rejects a missing week inside the stored report range, so a gap such as Week 35 followed by Week 40 cannot be published unnoticed.

4. Review the output on desktop and on an iPhone-sized viewport in both portrait and landscape orientation.

   For a local preview, run `npm run preview` and open the report under `http://127.0.0.1:8765/reports/`.

The builder has no third-party dependencies. Node.js is the only requirement.

After preparing or correcting a report, synchronize the operational monthly-folder
copy as well. Preview the exact source and destination first:

```powershell
npm run report:sync -- "reports/YYYY-MM/report.html" "path/to/Finance/monthly-folder"
```

Review the destination, then repeat with `--write`. The command runs all report
checks, preserves the previous monthly copy privately under
`output/monthly-sync-backups/`, copies the checked report, and verifies byte-for-byte
equality. Do not commit private backups. Do not leave Finance using an older HTML.

## Weekly URL rotation

Each newly completed week must be published under a new token-only
`venus.milolab.io` URL. The GabBuild publisher must be run with
`--series tdsg-weekly-payments --gate token-only --supersede-previous` and an
exact release approval containing `supersedePrevious: true`. That verified release
registers the new URL and revokes the previous TDSG weekly-payment URL atomically;
the old link then returns HTTP 410 and must not be reused or updated for the new week.
Send the new URL only after the Venus deployment and cache-busted integrity probe pass.
Preserve report history inside the new viewer. Verify that superseded weekly
links are disabled with HTTP 410; do not manually retire the only working link
before the replacement release succeeds. Never bypass a required release check.
An explicitly approved correction to the current viewer may keep its existing URL,
provided its asset and registered SHA are updated together and the viewer remains
capped at that approved week. This exception does not apply when a new week's
report is added.

Report filenames and visible labels use continuous ISO calendar week numbers. They do not restart at Week 1 each month. For example, the report ending 30 August 2026 is `Week35`, followed by `Week36` for the next calendar week.

## Source documents and folders

Use the restored **TOP International Holding - Finance** shortcut in OneDrive,
then **20. Top Development Services Guinea - TDSG**. Do not confuse it with a
separate, incomplete Finance folder. The Windows paths below describe the
operational locations; they need not exist locally on another machine.

- Weekly payment list and completed report: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Weekly Payment Approval Lists\YYYY\MM.MMMYYYY`
- China PRFs and supporting documents: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Payment Request\TDSG CHINA\YYYY\[PRF folder]`
- Guinea PRFs and supporting documents: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Payment Request\TDSG GUINEA\YYYY\MM.MMMYYYY\[PRF folder]`
- Bank statements: `Cash & Bank Records\Bank Statement\YYYY\[bank/account]` beneath the TDSG root.
- Recent bank and cash records: `Daily Bank\YYYY\YYYYMMDD` beneath the TDSG root, plus `Cash & Bank Records\Petty Cash`.
- The authorized Venus mailbox: search relevant China PRF and Rouge payment-on-behalf correspondence, approval replies, invoices, receipts, and remittance attachments. Inspect the attachment contents; a request-labelled file may contain a bank-submission screen instead of the actual PRF. Save the message reference and attachment provenance privately. An expired mail session is an access issue, not evidence that a document does not exist.

For each report week:

1. Use or compile the weekly payment Excel, then inspect the matching PRF folder, relevant email threads, and attachments. The report can contain transactions or supplier details not fully described in an existing weekly Excel file.
2. Include only completed payments dated within the reporting week. A document received later may establish an earlier payment, but must not move the payment or extend the cutoff. Check the statement's actual date filter and the cashbook's transaction dates, not its filename or upload date. Establish coverage through Sunday for all paying accounts and cash/POB activity; never assume missing records mean no payments.
3. Take the payment mode from the PRF and remittance evidence: `OCBC`, `Ecobank`, `Cash`/`Petty Cash - [custodian]`, or `Rouge POB`, as applicable.
4. Use the actual supplier or ultimate payee shown by the invoice, contract, bill of lading, receipt, or remittance. Do not use the petty-cash custodian as the supplier when the underlying supplier can be identified.
5. When one remittance settles multiple invoices, show the correct supplier and supporting invoice/contract references and reconcile the remittance to the combined invoices.
6. Use a concise purpose followed by the contract, invoice, BL, or other reference in parentheses when available.
7. Record the original transaction currency and amount, USD reporting amount, payment-date BCRG exchange rate for GNF payments, and the correct category.
8. Reconcile every detail row to its PRF/supporting documents, then reconcile the TDSG subtotal, Rouge POB subtotal, category summary, and Week Total.

If the weekly Excel file conflicts with the approved PRF, invoice, receipt, or
bank record, investigate and record the resolution privately. Resolve conflicting
payment dates before choosing a payment-date exchange rate. Do not silently copy
the Excel description or use an approval email as proof of completed payment.

This source repository is public. Authorization to prepare a report, publish its
token-only viewer, and message the configured recipients does not by itself
authorize disclosing new payment data in a public Git push. Keep private source
documents, mailbox data, routing, credentials, and delivery evidence out of Git.

## Locked report standard

- Arial throughout: 13 px body, 12 px table content, 11 px table headers, 20 px section headings, and 28 px report date (reduced on mobile).
- The embedded TOP emblem and full company name share one compact, vertically centered header.
- No navigation bar; the report is short enough to read as one page.
- Tables use identical column widths and horizontal scrolling on narrow screens, so no data is hidden.
- The `Payment Mode` column follows `Payment Date` and uses `OCBC`, `Ecobank`, `Petty Cash - [custodian]`, or `Rouge POB`.
- Table content is vertically centered. Ordinary payees, categories, and amounts use regular weight; headings and total rows are bold.
- Table rows have matching 16 px outer cell insets, and mobile pages retain equal 16 px left/right gutters. Both payment tables use the same spacing rules.
- Category pills retain distinct colors through the classes `staff`, `site`, `office`, `comm`, `parts`, `log`, and `ga`.
- Summary categories and detail rows display from highest to lowest USD amount. Subtotals remain at the bottom.
- The exchange-rate column is titled `Ex. Rate`; values display as `1 : 8745`, while USD/EUR-only payments display an em dash.
- All table headers are left-aligned. `Original Amount` and `USD` values are right-aligned with tabular numerals for consistent decimal-position alignment. Original Amount is not totalled; USD remains the common reporting amount and subtotal.
- Detail tables reserve wider, separate columns for `Original Amount`, `USD`, and `Ex. Rate` so their headers and values never overlap.
- The footer states only that GNF payments are converted to USD using the applicable payment-date BCRG rate.
- Purposes use a concise description followed by the contract, invoice, BL, or other reference in parentheses when available: `Purchase [item] ([reference])`.
- `Payee / Supplier` shows the actual recipient or supplier. For petty-cash payments, the staff custodian belongs in `Payment Mode`, not in the supplier field; use `Various [type] Suppliers` when one PRF consolidates multiple vendors.
- TDSG subtotal, Rouge POB subtotal, and Week Total must all be present and reconcile.
- Subtotal counts refer to payment lines.
- When one Rouge POB PRF contains multiple vessel cost lines, show one bold parent payment row followed by numbered supporting rows. Leave the supporting rows' PRF, date, mode, payee, category, and exchange-rate cells blank; retain normal table sizing and spacing, using only lighter muted italic text to distinguish them. Supporting rows must never be counted again in subtotals, summaries, reconciliation extracts, or sorting totals.
- Every report is standalone: the logo, stylesheet, and behavior are embedded. External fonts and network resources are not used.
- A restrictive Content Security Policy permits only the embedded image, style, and script required by the report.

## Source of truth

- `templates/report.css` controls the visual and responsive standard.
- `templates/report.js` controls exchange-rate display and descending sorting.
- `scripts/prepare-report.mjs` is the required entry point for each new report; it detects the input format, applies the current templates, and verifies the repository.
- `scripts/standardize-report.mjs` applies both templates to a report.
- `scripts/verify-reports.mjs` checks structure, security, mobile scrolling, labels, total reconciliation, and exact agreement with both shared templates.
- The public viewer must be capped at its approved latest week. A later GitHub report appears only after a replacement public URL is released and the earlier URL is withdrawn.

Change the templates and checks together when the approved report standard changes. Do not hand-edit a generated report without updating the reusable source of truth.

## August 2026 monthly PRF control

The consolidated PRF, bank-clearance and HTML reconciliation workbook is generated by `scripts/build-monthly-prf-register.mjs`. Run it from the repository root in the Codex spreadsheet runtime after updating the source evidence and the register data in the builder.

The workbook standard is intentionally simple:

- one `Combined Register` replaces separate PRF, HTML-reconciliation and HTML-payment lists;
- normal register rows use a white background and one consistent dark font colour;
- background colour alone identifies discrepancies, pending checks and other follow-up items;
- filters and frozen headings remain enabled; and
- generated workbooks and previews stay under `outputs/` and are not committed.

Before distributing a refreshed workbook, review every highlighted row, confirm the summary counts, and use the formula-error scan and sheet previews produced by the builder.

## WhatsApp notifications

Use the reusable formatter and notification rules in [WHATSAPP_NOTIFICATIONS.md](WHATSAPP_NOTIFICATIONS.md).
