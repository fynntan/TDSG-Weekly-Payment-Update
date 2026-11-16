# WhatsApp notification format

Use `node scripts/format-whatsapp-notification.mjs <private-notification.json>` to
prepare notification messages before sending. The output is a JSON array of exact
message strings; send each part in order through the existing authorized sender.
Keep input files, rendered messages, recipient configuration and receipts private.

Input uses `title`, optional HTTPS `url`, and `groups`, each with a `company` and
`items`. Each item is either a plain-English detail or `{ "reference": "exact code",
"detail": "short verified purpose" }`. Omit `company` for general notices.

The formatter adds a bold sentence-case title, bold company headings, blank lines
between companies, and numbered parts within 3,500 characters. It preserves codes,
amounts and currencies. Supply concise everyday English; do not use all-capital
prose. Include the verified report/review URL where available. State pending work
plainly. Successful notifications also use this format, superseding URL-only rules.

Storage and usage alerts retain their existing format. To pass one through, set
`kind` to `storage` or `usage` and `existingMessage` to its exact original text.

Formatting does not authorize a send or change recipients, evidence checks or
schedules. Confirm the actual sender and recipient, retain per-update idempotency
records, compare the outgoing body and record the strongest verified send status.
API acceptance does not establish recipient delivery or reading.
