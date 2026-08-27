# TDSG Weekly Payment Update — Project Memory

Last updated: 2026-08-27 (Asia/Singapore)

## Purpose

This repository is the working home and source of truth for TDSG weekly payment reports. A weekly report shows payments actually completed during the reporting week; an approved payment request alone is not proof of payment.

## Working locations

- GitHub: `fynntan/TDSG-Weekly-Payment-Update`
- Primary branch: `main`
- Fynn local repository: `C:\Users\FynnTan\TDSG Weekly Payment Update`
- TDSG working root: `C:\Users\FynnTan\OneDrive - Top International Holding Pte Ltd\20. Top Development Services Guinea - TDSG`
- Payment requests: `Payment Request`
- Bank statements: `Cash & Bank Records\Bank Statement\2026`
- Weekly reports and pending register: `Weekly Payment Approval Lists\2026`

## Governing rule: completed payment evidence controls inclusion

The presence of a payment under `Payment Request` is not proof that it was paid.

- Online bank payment: include only when the relevant bank statement shows the deduction, using the posting/value date as the payment date.
- Cash payment: include only when the completed cash-payment evidence supports payment within the week.
- Rouge payment on behalf: include only when the completed Rouge POB evidence supports payment within the week.
- Approved or submitted online payment without bank deduction: exclude it and record it in the pending-bank-deduction register.
- Draft remittance, transfer instruction, PRF, or online-banking submission alone: insufficient evidence of completed payment.
- Payment completed after the weekly cutoff: include it in the later week containing the actual payment date, not the earlier request week.
- Match using PRF number first, then payee, currency, and exact amount. Investigate rather than guess when evidence conflicts.

Example: `TDSG-2026-08-282` (GMS), GNF 177,826,148, was requested on 5 August 2026 but Ecobank deducted it on 11 August 2026. It belongs in Week 2, not Week 1.

## Source-document rules

- Start from the matching Excel file under `Weekly Payment Approval Lists\YYYY\MM.MMMYYYY`.
- Verify each transaction against the corresponding China or Guinea PRF folder under `Payment Request` and its invoices, contracts, receipts, bills of lading, remittances, cash evidence, or Rouge POB evidence.
- Use the completed-payment evidence for inclusion and payment date.
- Use the PRF and underlying documents for payment mode, actual supplier/payee, purpose, contract/invoice reference, original amount, category, and supporting description.
- The actual supplier belongs in `Payee / Supplier`; a cash custodian belongs in `Payment Mode`.
- One remittance covering multiple invoices must reconcile to the combined invoices.
- Reconcile only through the stated report end date.

## Pending-bank-deduction register

Use the rolling Excel workbook named like `TDSG Online Payments Pending Bank Deduction_13Jul-xxAug2026.xlsx` with these columns:

1. PRF No.
2. PRF Date
3. Payee / Supplier
4. Purpose
5. Currency
6. Amount
7. Status (`Pending bank deduction`)

Keep an online payment in the register until bank deduction is confirmed. For a historical report, preserve the status applicable at that week's cutoff.

## Required weekly workflow

1. Confirm the weekly period and cutoff date.
2. Review candidate PRFs and supporting documents.
3. Identify payment mode and expected paying bank/account.
4. Verify completed payment through the cutoff using bank, cash, or Rouge POB evidence as applicable.
5. Separate confirmed payments from pending online payments.
6. Verify actual supplier/payee, concise purpose, references, original amount, USD value, exchange rate, and category.
7. Generate the report only with `npm run report:prepare -- <input> <reports/YYYY-MM/output>`.
8. Run `npm run check`.
9. Review desktop and iPhone portrait/landscape layouts.
10. Reconcile category totals, TDSG subtotal, Rouge POB subtotal, and Week Total before committing.

## Locked report standard

- The shared CSS and JavaScript under `templates/` control the approved desktop and mobile presentation.
- `Payment Mode` follows `Payment Date` and identifies `OCBC`, `Ecobank`, `Petty Cash - [custodian]`, or `Rouge POB`.
- `Payee / Supplier` identifies the actual supplier or ultimate recipient where supporting evidence permits.
- `Original Amount` shows the original currency code and value; it is not subtotalled.
- `USD` is the common reporting amount and remains subtotalled.
- `Ex. Rate` uses `1 : 8745` style for GNF conversions and an em dash for direct USD/EUR payments.
- Detail and summary rows are stored from highest to lowest USD amount; subtotal rows remain last.
- TDSG subtotal, Rouge POB subtotal, category summary, and Week Total must reconcile.
- The report must remain standalone, secure, and horizontally scrollable on narrow screens.

## August 2026 correction reference

Week 1, 03–09 August 2026, excludes PRF `08-282` because its bank deduction occurred on 11 August:

- TDSG subtotal: 7 payments; USD 408,011.
- Rouge POB subtotal: 1 payment; USD 717.
- Week Total: USD 408,728.

## Repository conventions

- Never commit credentials, tokens, authentication codes, bank login details, confidential source documents, or personal contact details.
- Keep operational payment documents in the controlled OneDrive folders.
- Update templates, automated checks, README, and this memory together when approved requirements change.
