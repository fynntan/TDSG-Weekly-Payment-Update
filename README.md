# TDSG Weekly Payment Reports

This repository contains the reviewed weekly payment reports and the reusable presentation standard for **TOP DEVELOPMENT SERVICES GUINEA SARLU**.

## Create the next weekly report

1. Prepare the new report HTML from the approved payment source documents listed under **Source documents and folders** below. Do not derive the transaction list only from an earlier HTML report.
2. From the repository root, run the single preparation command:

   ```powershell
   npm run report:prepare -- "path\to\input-report.html" "reports\YYYY-MM\output-report.html"
   ```

   This detects the old or current report format, applies the latest shared templates, saves the result below `reports/`, and runs all automated checks. Do not copy an earlier report's embedded CSS or JavaScript manually.

3. Run the automated checks:

   ```powershell
   npm run check
   ```

   GitHub Actions runs the same check automatically on every push and pull request.

4. Review the output on desktop and on an iPhone-sized viewport in both portrait and landscape orientation.

   For a local preview, run `npm run preview` and open the report under `http://127.0.0.1:8765/reports/`.

The builder has no third-party dependencies. Node.js is the only requirement.

## Source documents and folders

Use these OneDrive folders as the source of truth:

- Weekly payment list and completed report: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Weekly Payment Approval Lists\YYYY\MM.MMMYYYY`
- China PRFs and supporting documents: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Payment Request\TDSG CHINA\YYYY\[PRF folder]`
- Guinea PRFs and supporting documents: `C:\Users\VenusTham\OneDrive - Top International Holding Pte Ltd\Finance\20. Top Development Services Guinea - TDSG\Payment Request\TDSG GUINEA\YYYY\MM.MMMYYYY\[PRF folder]`

For each report week:

1. Use the weekly payment Excel file as the starting list, then inspect the matching PRF folder and every relevant attachment or remittance. The report can contain transactions or supplier details that are not fully described in the weekly Excel file.
2. Include only payments whose payment date falls on or before the report end date. Do not use documents dated after the report end date to extend the reconciliation.
3. Take the payment mode from the PRF and remittance evidence: `OCBC`, `Ecobank`, `Cash`/`Petty Cash - [custodian]`, or `Rouge POB`, as applicable.
4. Use the actual supplier or ultimate payee shown by the invoice, contract, bill of lading, receipt, or remittance. Do not use the petty-cash custodian as the supplier when the underlying supplier can be identified.
5. When one remittance settles multiple invoices, show the correct supplier and supporting invoice/contract references and reconcile the remittance to the combined invoices.
6. Use a concise purpose followed by the contract, invoice, BL, or other reference in parentheses when available.
7. Record the original transaction currency and amount, USD reporting amount, payment-date BCRG exchange rate for GNF payments, and the correct category.
8. Reconcile every detail row to its PRF/supporting documents, then reconcile the TDSG subtotal, Rouge POB subtotal, category summary, and Week Total.

If the weekly Excel file conflicts with the approved PRF, invoice, or remittance, investigate the difference and use the underlying approved supporting evidence; do not silently copy the Excel description.

## Locked report standard

- Arial throughout: 13 px body, 12 px table content, 11 px table headers, 20 px section headings, and 28 px report date (reduced on mobile).
- The embedded TOP emblem and full company name share one compact, vertically centered header.
- No navigation bar; the report is short enough to read as one page.
- Tables use identical column widths and horizontal scrolling on narrow screens, so no data is hidden.
- The `Payment Mode` column follows `Payment Date` and uses `OCBC`, `Ecobank`, `Petty Cash - [custodian]`, or `Rouge POB`.
- Table content is vertically centered. Ordinary payees, categories, and amounts use regular weight; headings and total rows are bold.
- Category pills retain distinct colors through the classes `staff`, `site`, `office`, `comm`, `parts`, `log`, and `ga`.
- Summary categories and detail rows display from highest to lowest USD amount. Subtotals remain at the bottom.
- The exchange-rate column is titled `Ex. Rate`; values display as `1 : 8745`, while USD/EUR-only payments display an em dash.
- All table headers are left-aligned. `Original Currency` and `USD` values are right-aligned with tabular numerals for consistent decimal-position alignment. Original Currency is not totalled; USD remains the common reporting amount and subtotal.
- Detail tables reserve wider, separate columns for `Original Currency`, `USD`, and `Ex. Rate` so their headers and values never overlap.
- The footer states only that GNF payments are converted to USD using the applicable payment-date BCRG rate.
- Purposes use a concise description followed by the contract, invoice, BL, or other reference in parentheses when available: `Purchase [item] ([reference])`.
- `Payee / Supplier` shows the actual recipient or supplier. For petty-cash payments, the staff custodian belongs in `Payment Mode`, not in the supplier field; use `Various [type] Suppliers` when one PRF consolidates multiple vendors.
- TDSG subtotal, Rouge POB subtotal, and Week Total must all be present and reconcile.
- Every report is standalone: the logo, stylesheet, and behavior are embedded. External fonts and network resources are not used.
- A restrictive Content Security Policy permits only the embedded image, style, and script required by the report.

## Source of truth

- `templates/report.css` controls the visual and responsive standard.
- `templates/report.js` controls exchange-rate display and descending sorting.
- `scripts/prepare-report.mjs` is the required entry point for each new report; it detects the input format, applies the current templates, and verifies the repository.
- `scripts/standardize-report.mjs` applies both templates to a report.
- `scripts/verify-reports.mjs` checks structure, security, mobile scrolling, labels, total reconciliation, and exact agreement with both shared templates.

Change the templates and checks together when the approved report standard changes. Do not hand-edit a generated report without updating the reusable source of truth.
