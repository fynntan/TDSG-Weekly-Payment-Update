# WhatsApp notification format

Use `node scripts/format-whatsapp-notification.mjs <private-notification.json>` to
prepare notification messages before sending. The output is a JSON array of exact
message strings; send each part in order through the existing authorized sender.
Keep input files, rendered messages, recipient configuration and receipts private.

Input uses `title`, optional HTTPS `url`, and `groups`, each with a `company` and
`items`. Each item is either a plain-English detail or `{ "reference": "exact code",
"detail": "short verified purpose" }`. Omit `company` for general notices.

For every PRF or purchase item, use the structured form below so all four fields
appear in this order: reference, short supplier name, description, amount/currency.
Separate fields with ` | ` (one space on each side), for example:
`COMPANY-2026-001 | Example supplier | Office supplies | USD 100`.
Keep spaces within names and descriptions. Storage and usage alerts remain unchanged.

```json
{
  "reference": "KCP-2026-11-002",
  "supplier": "Hebei Gansibu",
  "description": "100-tonne crane",
  "amount": "USD 260,000"
}
```

Use verified source facts. Supplier names may be shortened without changing the
legal party's identity. If a supplier or amount is not verified, explicitly write
`Supplier not verified` or `Amount not verified`; never guess or use zero. Keep
currency codes, amounts and PRF references exact. Legacy `detail` items remain
readable for older notifications, but new PRF notifications use all four fields.

The formatter adds a bold sentence-case title, bold company headings, a blank line
between every bullet point and between companies, and numbered parts within 3,500 characters. It preserves codes,
amounts and currencies. Supply concise everyday English; do not use all-capital
prose. Include the verified report/review URL where available. State pending work
plainly. Successful notifications also use this format, superseding URL-only rules.

## Recipient-facing content

The WhatsApp message summarizes the new report for its recipients. Include the
reporting period, payment count/total and meaningful payment highlights, exceptions,
pending items or specific missing evidence. For a month-end release, distinguish
the weekly TDSG and monthly TGM periods and their totals. Use concise bullet points,
each separated by an empty line. Do not repeat the same total in several bullets.

Keep replies about the agent's work in the Codex chat: changes requested by the
user, restored Prepared by/Reviewed by labels, formatting or template fixes, Git
commits/pushes, tests, deployment, hashes, tool usage, schedule changes and recovery
implementation do not belong in the recipient message. A report correction may
describe the changed payment or total when material, without describing the editing
process. State access or missing-source blockers in ordinary business language
only when they affect the recipient's report; omit tool diagnostics.

The formatter rejects common implementation/attribution phrases rather than
silently deleting them. Review every outgoing item for recipient relevance before
formatting; this content review is still required for phrases outside that guard.
The storage and usage alert exceptions below remain unchanged.

Example layout (illustrative placeholders only):

```text
*Weekly payment report*

[Verified report URL]

*Top Development Services Guinea (TDSG)*
• [Week and reporting dates]

• [Payment count and total in USD]

• [Material payment highlight or specific pending item, if any]
```

Storage and usage alerts retain their existing format. To pass one through, set
`kind` to `storage` or `usage` and `existingMessage` to its exact original text.

Formatting does not authorize a send or change recipients, evidence checks or
schedules. Confirm the actual sender and recipient, retain per-update idempotency
records, compare the outgoing body and record the strongest verified send status.
API acceptance does not establish recipient delivery or reading.
