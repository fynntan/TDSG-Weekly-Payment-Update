# TDSG Weekly Payment Update — Project Memory

Last updated: 2026-08-12 (Asia/Singapore)

## Purpose

This repository stores the durable working instructions for preparing TDSG weekly payment reports. The weekly report must show payments actually deducted by the bank during the reporting week, not every approved payment request.

## Working locations

- GitHub: `fynntan/TDSG-Weekly-Payment-Update`
- Local repository: `C:\Users\FynnTan\TDSG Weekly Payment Update`
- TDSG working root: `C:\Users\FynnTan\OneDrive - Top International Holding Pte Ltd\20. Top Development Services Guinea - TDSG`
- Payment requests: `Payment Request`
- Bank statements: `Cash & Bank Records\Bank Statement\2026`
- Weekly reports and pending register: `Weekly Payment Approval Lists\2026`

## Governing rule: bank deduction controls inclusion

The presence of a payment under `Payment Request` is not proof that it was paid.

A payment may be included in a weekly payment report only when the relevant bank statement shows that the amount was deducted, with a posting/value date inside that report's weekly period.

- Approved or submitted but not bank-deducted: exclude it from the weekly report and record it in the pending-bank-deduction Excel file.
- Draft remittance, transfer instruction, payment request form, or online-banking submission alone: insufficient evidence of payment.
- Bank-deducted after the weekly cutoff: exclude it from the earlier week and include it in the later week containing the actual bank posting/value date.
- Bank-deducted within the week: include it and use the bank date as the payment date.
- Match using PRF number first, then payee, currency, and exact amount. Investigate rather than guess when evidence conflicts.

Example: `TDSG-2026-08-282` (GMS), GNF 177,826,148, was requested on 5 August 2026 but Ecobank deducted it on 11 August 2026. It must not appear in Week 1 (03–09 August). At the Week 1 cutoff it belongs in the pending register, and the actual deduction belongs to Week 2.

## Pending-bank-deduction register

Use the rolling Excel workbook named like `TDSG Online Payments Pending Bank Deduction_13Jul-xxAug2026.xlsx`.

Required columns:

1. PRF No.
2. PRF Date
3. Payee / Supplier
4. Purpose
5. Currency
6. Amount
7. Status (`Pending bank deduction`)

The filename's ending date must reflect the register cutoff. Keep a payment in this register until bank deduction is confirmed. When preparing a historical weekly report, preserve the status applicable at that week's cutoff even if a later bank statement subsequently shows deduction.

## Weekly workflow

1. Confirm the exact weekly period and cutoff date.
2. Review new payment-request folders for candidate transactions and extract PRF number, request date, payee, purpose, currency, and amount.
3. Identify the expected paying bank/account and payment method.
4. Check the relevant bank statements through the weekly cutoff. Do not rely on folder placement or draft remittance documents.
5. Reconcile every candidate against the bank by PRF number, payee, currency, exact amount, and bank posting/value date.
6. Put confirmed deductions dated within the week into the weekly report.
7. Put submitted online payments without a qualifying deduction into the pending-bank-deduction workbook.
8. Recalculate transaction counts, currency subtotals, category totals, main/Rouge subtotals, and the overall weekly total after all exclusions.
9. Verify that no pending PRF remains in the weekly report and that no confirmed in-period deduction is omitted.
10. Save the report under the correct monthly folder and update this memory whenever the rules change.

## Report validation

- The reporting period in the title, detail table, and footer must agree.
- Every reported payment must have bank evidence within the period.
- Every displayed subtotal must equal its detail rows.
- The category breakdown must equal the main payment subtotal.
- The week total must equal the main subtotal plus payments made on behalf by Rouge.
- GNF-to-USD conversions must use the stated rate for the applicable payment date; direct USD payments should be marked as USD payments.
- Removing a transaction requires removing its category amount where applicable and updating all affected totals and counts.
- Preserve the distinction between TDSG payments and payments made on behalf by Rouge.

## August 2026 correction reference

For `TDSG Weekly Payment Report_Week1_03-09Aug2026.html`, removing 08-282 produced:

- Main TDSG subtotal: 7 payments; GNF 68,654,000; US$408,011.
- Rouge subtotal: 1 payment; GNF 6,281,905; US$717.
- Week total: US$408,728.
- The `HR & Community` amount of US$20,280 was removed from the Week 1 category breakdown.

## Repository conventions

- Never commit credentials, tokens, authentication codes, bank login details, or confidential source documents.
- Store process instructions and non-sensitive reconciliation rules here; keep operational payment documents in the controlled OneDrive folders.
- Record material rule changes and worked corrections in this file.
