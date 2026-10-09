# Appointment requests with staff email confirmation

The website collects a preferred showroom, service, date and time. Staff receives
the request by email and replies to the customer to confirm it or suggest another
time. No database, private approval page or automatic calendar invitation is
required.

## Server settings

Set these privately in the hosting provider, then restart or redeploy the app:

| Setting | Purpose |
| --- | --- |
| `SMTP_HOST` | Regional AWS SES SMTP endpoint |
| `SMTP_PORT`, `SMTP_SECURE` | `587` and `false` for STARTTLS, or `465` and `true` |
| `SMTP_USER`, `SMTP_PASS` | Regional SES SMTP credentials |
| `SMTP_FROM` | Verified SES sender address or verified-domain address |
| `SMTP_REPLY_TO` | Monitored showroom inbox for replies to customer acknowledgments |
| `APPOINTMENT_NOTIFICATION_TO` | Staff inbox receiving appointment requests; comma-separated addresses supported |

The staff email's Reply-To is the customer's address, so **Reply** opens a message
to the customer. The customer acknowledgment's Reply-To is the monitored showroom
address, falling back to the first staff recipient if `SMTP_REPLY_TO` is blank.

Appointment mail requires TLS. AWS SES sandbox accounts can send only to verified
recipients; production customer email requires SES production access. See
[AWS SES SMTP setup](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html).
Do not put SMTP credentials in Git or public environment variables.

## What the customer sees

- The listed times are preferred choices during showroom hours, not guaranteed
  availability. Staff checks the actual calendar before confirming.
- The form reports receipt only after SMTP accepts the notification for all
  intended staff recipients. SMTP acceptance does not prove inbox delivery.
- The acknowledgment says the appointment is awaiting confirmation. It includes
  the requested details and reference, without an invite or confirmed booking.
- If the customer acknowledgment fails after staff receipt, the request still
  counts as received. Staff can reply directly to the original notification.
- A definite staff delivery failure allows an explicit retry. An uncertain send
  or lost response advises the customer to call before sending another request.

The site does not reserve slots, synchronize a calendar, store appointment status
or guarantee duplicate suppression across server instances. Requests from an
unchanged submission carry the same reference, so staff can identify duplicate
emails. Staff should confirm each reference once and manage availability in the
showroom's shared calendar.

## Staff reply

1. Check the showroom calendar and customer details.
2. Reply directly to the request email. Confirm the date, time in Eastern Time,
   showroom address and service, or propose another time.
3. Add a confirmed appointment to the shared calendar.

Example confirmation after checking availability:

> Your appointment is confirmed for [date] at [time] Eastern Time at The Mall at
> Partridge Creek, [showroom address]. We look forward to helping you with
> [service]. Please reply if you need to change your appointment.

## Manual release test

Use staging and staff/customer test inboxes. These steps send real email:

1. Submit a future preferred time. Verify the page says the request awaits staff
   confirmation. Check the staff email includes the details, notes and reference.
2. Select **Reply** on the staff email. It must address the customer. Send a test
   confirmation manually and verify customer receipt.
3. Check the customer acknowledgment says it is not confirmed, has no calendar
   invite, and replies to the showroom inbox.
4. Disable staging SMTP temporarily. The form must not claim successful receipt.
   Restore SMTP and test an explicit retry.
5. Test a closed date, past date/time and missing fields. The form must request
   a valid preferred time and the server must reject invalid submissions.
6. Check the shared calendar process for two requests preferring the same time.
   Staff must resolve the conflict before confirming either customer.

## Automated checks

Use Node.js 24.x and pnpm 10.28.2:

```bash
pnpm exec tsx --test src/lib/shopify/*.test.ts src/lib/appointments/*.test.ts src/lib/calendar.test.ts src/lib/appointment-email.test.ts src/components/SeoJsonLd.test.ts src/app/api/appointments/route.test.ts
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
git diff --check
```

Automated SMTP tests use boundary mocks. They do not establish live SES acceptance
or inbox delivery; complete the staging test above before launch.

## Implementation verification

The following commands passed with Node.js 24.x. The test command ran all 297
remaining commerce, appointment email, preferred-time and calendar utility tests:

```bash
pnpm exec tsx --test src/lib/shopify/*.test.ts src/lib/appointments/*.test.ts src/lib/calendar.test.ts src/lib/appointment-email.test.ts src/components/SeoJsonLd.test.ts src/app/api/appointments/route.test.ts
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm exec tinacms build --datalayer-port 9001 --skip-cloud-checks --skip-search-index --no-client-build-cache
pnpm exec next build --webpack
git diff --check
```

The first Next build found stale generated development types referencing the
removed approval routes. A temporary `pnpm exec next dev --webpack --port 3101`
server regenerated them when `/schedule-appointment` was loaded. That server was
stopped, and the production build and standalone TypeScript check then passed.
No compiler checks were disabled.

Browser checks used temporary scripts:

```bash
node /tmp/jbarbaro-manual-appointment-ui-build.mjs
node /tmp/jbarbaro-manual-appointment-ui-qa.mjs
pnpm exec next start --port 3100
node /tmp/jbarbaro-manual-appointments-production-qa.mjs
```

Ten component browser groups passed, including single in-flight submission,
pending success, same-reference retry after known failures, blocked uncertain
retries, keyboard focus and four responsive widths. Production checks passed for
real preferred-time loading without a database, holiday closures, pending
receipt, call recovery, removed approval page/API returning 404, and no page
errors or horizontal overflow at 320, 390, 768 and 1440 pixels. Appointment POSTs
were intercepted; no live emails were sent. The production preview was stopped
afterward. Live SMTP acceptance, staff replies and inbox delivery still require
the manual release test above.
