# TDSG Weekly Payment Update — Project Memory

Last updated: 2026-08-07 (Asia/Singapore)

## Purpose

This repository is the working home and source of truth for TDSG weekly payment reports.

## Repository

- GitHub: `fynntan/TDSG-Weekly-Payment-Update`
- Git protocol: HTTPS
- Primary branch: `main`

## Current state

- July 2026 Week 3, Week 4, and Week 5 reports are stored under `reports/2026-07/`.
- The approved visual, mobile, sorting, exchange-rate, subtotal, and security rules are reusable through `templates/` and `scripts/standardize-report.mjs`.
- `npm run check` validates every committed report, including TDSG, Rouge POB, and weekly total reconciliation.
- The generated reports are standalone and do not depend on external fonts or network assets.

## Working conventions

- Keep credentials, access tokens, authentication codes, source workbooks, and personal contact details out of the repository.
- Start from the matching Excel file under `Weekly Payment Approval Lists\YYYY\MM.MMMYYYY`, then verify every transaction against the corresponding China or Guinea PRF folder under `Payment Request` and its invoices, contracts, receipts, bills of lading, and remittances.
- Record the reporting period and source for every weekly payment update. The approved PRF and supporting/remittance evidence control when the weekly Excel is incomplete or less specific.
- Reconcile each report only through its stated report end date.
- Use `npm run report:prepare -- <input> <reports/YYYY-MM/output>` for each new report so it receives the latest templates and passes the repository checks.
- Run `npm run check` and complete desktop plus iPhone portrait/landscape review before committing.
- Update the templates, automated checks, README, and this memory together when requirements change.

## Weekly update checklist

1. Add or refresh the source payment data through the report end date.
2. Confirm the reporting period and source.
3. Validate category totals, TDSG subtotal, Rouge POB subtotal, and Week Total.
4. Generate and validate the report with `npm run report:prepare -- <input> <output>`.
5. Run `npm run check`.
6. Review desktop and iPhone portrait/landscape layouts.
7. Record discrepancies or follow-up items.
8. Commit and push the reviewed update.
