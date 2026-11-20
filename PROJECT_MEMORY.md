# TDSG Weekly Payment Update — Project Memory

Last updated: 2026-11-20 (Asia/Singapore)

## Next-build handoff — 20 November 2026

- Week 46, covering 9–15 November 2026, is now filed under `reports/2026-11/TDSG Weekly Payment Report_Week46_09-15Nov2026.html`. The supplied Finance HTML was imported unchanged, with SHA-256 `49744c8f9a1797a9146394f7d023a7209392cf1acd762f2f7f802f6dac2991c3`. This publication was an import of the supplied prepared/reviewed report, not a fresh audit resolving every earlier source-evidence question.
- The verified viewer defaults to Week 46 and preserves all 18 weekly reports plus TGM June–October history. The private publisher commit is `c308459f3b26513ede137b78fa1f5c23116f1538`; its production deployment succeeded. The new release passed the live SHA check, and all eight superseded weekly links returned HTTP 410. Do not reuse an earlier week's URL for the next build.
- The local private publication handoff is `output/tdsg-week46/publication-status.json`, with source provenance under `input/weekly-html-imports/2026-11-20/`. It records the release URL, live verification and delivery receipt. The latest request sent the new URL to Venus; WhatsApp acceptance was confirmed, while recipient delivery/read status was not confirmed. Check this handoff before resending.
- Finance's monthly source and the filed report are byte-identical, so no replacement upload was needed. Validation passed for 18 reports, five notification tests and 18 publisher/viewer tests; desktop and phone portrait/landscape previews were reviewed.
- The next scheduled build is Tuesday, 24 November 2026 at 10:00 am Asia/Singapore, for ISO Week 47 (16–22 November). Follow README.md for source intake, register preparation, evidence checks, visual review, Finance synchronization, new-URL release and two-route delivery.
- Private handoff files are ignored and will not arrive with a Git pull. Obtain them through controlled storage or recheck the operational sources. Keep source documents, URLs, recipient configuration and receipts private. The earlier Week 46 review below is historical context, not the current publication status.

## Historical source review — 17 November 2026

- Resume Week 46, covering 9–15 November 2026. It remains incomplete; no Week 46 HTML or replacement viewer has been released. Week 45 is still the latest filed report.
- The local private checkpoint is `output/week46-review/checkpoint-2026-11-17/run-status.json`; the consolidated review is `output/week46-review/week46-source-review-status.json`. These ignored files contain the exact outstanding evidence, source findings, and delivery records. A Git pull does not transfer them: obtain the private handoff through controlled storage, or recheck the operational sources before continuing.
- Recheck bank coverage through Sunday, cashbook/voucher completeness, conflicting payment dates, completed Rouge POB evidence, and pending bank deductions. Inspect the actual statement filters and transaction dates. Do not infer payment from balance changes or a file's date.
- OneDrive access resumed during the review. Mailbox access requires renewed authentication before checking newer correspondence; keep credentials and mailbox exports private.
- Consult the private per-route receipts before repeating a missing-items notice. A completed report may still be sent after an earlier missing-items notice. Preserve the distinction between WhatsApp acceptance and confirmed delivery.
- Once evidence is complete, compile the weekly register and follow README.md for preparation, checks, visual review, Finance synchronization, approved URL rotation, and formatted two-route delivery. Keep new payment evidence and operational delivery details out of this public repository.

## Standing workflow — 16 November 2026

- The app automation runs Tuesday at 10:00 am GMT+8 for the previous Monday–Sunday. Verify its actual next timestamp in Singapore time after changes; the first setup had an eight-hour scheduling error.
- Compile the weekly payment Excel when no existing list is available. Its absence alone is not a missing external source; the underlying completed-payment evidence is still required.
- Check both the operational OneDrive folders and the authorized Venus mailbox. Recent statements and cashbooks may be under `Daily Bank`, and email attachments may resolve documents missing from the PRF folder. Filenames and upload dates do not establish transaction coverage.
- The latest URL instruction is a **new weekly token-only URL with old weekly links disabled**, superseding the earlier request to reuse a fixed URL. Retain history inside the new viewer and follow the verified publisher release process.
- Each run sends either the verified new report URL or a specific missing-items list through both configured WhatsApp sender–recipient pairs. Format both outcomes with `scripts/format-whatsapp-notification.mjs` under `WHATSAPP_NOTIFICATIONS.md`, sending all parts in order with per-part receipts. No HTML attachments. Verify each route independently, report failures, and allow a final report link after an earlier missing-items notice.
- The exact routes, account checks, source review, and email provenance are private under `output/week46-review/`. Do not copy contact numbers, mailbox exports, delivery receipts, or one-off intake scripts into Git. See README.md for the full operating rules.
- At the 16 November source review, Week 46 was incomplete. See the 20 November handoff above for the subsequent supplied-report import and publication; the earlier review record alone does not establish publication or delivery.

## Week 45 import and publication — 14 November 2026

- The colleague's Week 45 HTML for 2–8 November 2026 is filed under `reports/2026-11/TDSG Weekly Payment Report_Week45_02-08Nov2026.html`.
- Its SHA-256 is `3093880423ea32930919075c68ce5432eb8b8cd8d7528d2dd0029ca8e688ce7f`; the filed HTML exactly matches the supplied source. This was a report import, not a new audit of the payment evidence.
- All 17 weekly reports passed repository validation. The published viewer defaults to Week 45 and retains prior TDSG reports and the June–October 2026 TGM reports.
- Operational publication, retired-link verification, and WhatsApp delivery details are kept privately in `input/handoff/2026-11-14-week45.json` and the referenced files under `output/`. Keep these records and chat attachments out of Git.
- The source GitHub repository is public. Publishing there requires explicit authorization to disclose the payment report publicly; the private viewer publication is separate.

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
- Recent daily evidence: `Daily Bank\2026\YYYYMMDD`; verify document coverage inside each file.

## Governing rule: completed payment evidence controls inclusion

The presence of a payment under `Payment Request` is not proof that it was paid.

- Online bank payment: include only when the relevant bank statement shows the deduction, using the posting/value date as the payment date.
- Cash payment: include only when the completed cash-payment evidence supports payment within the week.
- Rouge payment on behalf: include only when the completed Rouge POB evidence supports payment within the week.
- A supplier receipt carrying the completed signature/company stamp is accepted as completed Rouge POB evidence.
- Approved or submitted online payment without bank deduction: exclude it and record it in the pending-bank-deduction register.
- Draft remittance, transfer instruction, PRF, or online-banking submission alone: insufficient evidence of completed payment.
- Payment completed after the weekly cutoff: include it in the later week containing the actual payment date, not the earlier request week.
- Match using PRF number first, then payee, currency, and exact amount. Investigate rather than guess when evidence conflicts.

Example: `TDSG-2026-08-282` (GMS), GNF 177,826,148, was requested on 5 August 2026 but Ecobank deducted it on 11 August 2026. It belongs in ISO Week 33, not Week 32.

## Source-document rules

- Use the matching Excel under `Weekly Payment Approval Lists\YYYY\MM.MMMYYYY` when present; otherwise compile the weekly list from verified source evidence. A self-prepared list is not independent proof of payment.
- Search the authorized Venus mailbox for matching China PRFs and Rouge POB evidence before declaring documents missing. Preserve source-message and attachment provenance privately.
- Verify each transaction against the corresponding China or Guinea PRF folder under `Payment Request` and its invoices, contracts, receipts, bills of lading, remittances, cash evidence, or Rouge POB evidence.
- Use the completed-payment evidence for inclusion and payment date.
- Use the PRF and underlying documents for payment mode, actual supplier/payee, purpose, contract/invoice reference, original amount, category, and supporting description.
- The actual supplier belongs in `Payee / Supplier`; a cash custodian belongs in `Payment Mode`.
- Vessel, shipment, and bill-of-lading names belong in `Purpose`, not `Payee / Supplier`; use the invoice or receipt issuer as the payee.
- One remittance covering multiple invoices must reconcile to the combined invoices.
- When one Rouge POB PRF covers several separately supported shipments, show one counted parent payment row and subordinate numbered breakdown rows. Keep PRF, date, mode, payee, category, and exchange rate blank in the child rows; use the normal table size/spacing with only lighter muted italic text. The child rows are already included in the parent and must never be counted again in report totals, sorting totals, or monthly controls.
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

1. Confirm the previous ISO Monday–Sunday period and cutoff date for the Tuesday run.
2. Use or compile the weekly Excel; review candidate PRFs, supporting documents, and relevant email attachments.
3. Identify payment mode and expected paying bank/account.
4. Verify completed payment through the cutoff using bank, cash, or Rouge POB evidence as applicable.
5. Separate confirmed payments from pending online payments.
6. Verify actual supplier/payee, concise purpose, references, original amount, USD value, exchange rate, and category.
7. Generate the report only with `npm run report:prepare -- <input> <reports/YYYY-MM/output>`.
8. Run `npm run check`.
9. Review desktop and iPhone portrait/landscape layouts.
10. Reconcile category totals, TDSG subtotal, Rouge POB subtotal, and Week Total before committing.
11. Synchronize the corrected HTML to its Finance monthly folder using `npm run report:sync -- <repository-report> <monthly-folder>` (preview), then `--write`. The command preserves a private backup and verifies exact equality; Finance's monthly copy must not be left behind the published report.
12. Follow README.md's new-URL release and two-route delivery rules. If material sources or checks remain incomplete, send the specific missing-items list instead of a completed-report link.

## Week 42 footer correction — 26 October 2026

Remove the sentence about PRF TDSG-2026-10-339's GNF 400,000,000 pending component
from the report footer. This is a wording-only change: do not add the pending
component to paid totals or alter completed-payment evidence rules. Keep the
existing public viewer URL for this correction and synchronize the monthly HTML.

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
- Keep the table's first-cell left inset and last-cell right inset equal at 16 px; mobile page gutters are also 16 px on both sides. Apply these shared template rules to each new report.

## August 2026 correction reference

ISO Week 32, 03–09 August 2026, excludes PRF `08-282` because its bank deduction occurred on 11 August:

- TDSG subtotal: 7 payments; USD 408,011.
- Rouge POB subtotal: 1 payment; USD 717.
- Week Total: USD 408,728.

ISO Week 35, 24–30 August 2026:

- PRF `TDSG-2026-08-295` is a completed Rouge POB payment dated 27 August 2026 based on signed and stamped supplier receipts.
- Its actual payee is `Mohzain Transit-Transport-Logistics`; Cali, Winning Ocean, and Winning Wave are shipment references.
- Break PRF 295 into four subordinate vessel cost lines beneath its counted parent: WA2649SH301 GNF 42,805,000; WK2657SH300 GNF 18,626,946; HLCUHAM260530640 GNF 18,547,973; and WA2644SH303 GNF 11,138,509.
- The single PRF parent row reconciles to GNF 91,118,428 and USD 10,372 at `1 : 8785`; its four subordinate vessel cost lines are informational breakdowns already included in the parent. Week 35 total is USD 89,086.
- Keep the repository report and the operational OneDrive HTML synchronized; Finance normally opens the OneDrive copy.

China PRF identifier correction:

- The amended cash book confirms `TDSG/CHN/2026-41` on the USD 1,898.22 payment and USD 48 bank-charge rows. The former `TGM` mismatch is resolved.

## Repository conventions

- Never commit credentials, tokens, authentication codes, bank login details, confidential source documents, or personal contact details.
- Keep operational payment documents in the controlled OneDrive folders.
- Update templates, automated checks, README, and this memory together when approved requirements change.
