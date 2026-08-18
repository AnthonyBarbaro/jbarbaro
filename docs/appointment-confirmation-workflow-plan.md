# Appointment Confirmation Workflow Plan

Date: 2026-08-17
Status: Planned — not implemented
Owner: J. Barbaro Clothiers

## Purpose

Replace the current email-only appointment intake with a reliable two-stage workflow:

1. A customer requests an available appointment time.
2. Jason reviews the request.
3. The customer receives a final confirmation only after Jason approves it.

Email should be the required source of truth for the first release. Transactional SMS can be added later after consent language, provider registration, and operational ownership are settled.

## Decisions Required Before Implementation

- Confirm whether only one appointment may occupy each 30-minute slot. If multiple stylists can serve customers simultaneously, model staff or showroom capacity before building availability.
- Decide whether a pending request temporarily holds its requested slot and define the approval SLA or hold-expiration policy.
- Confirm whether Jason uses Google Calendar, Outlook, or neither as the operational calendar.
- Choose the managed Postgres provider. Neon or Supabase through the Vercel Marketplace are the lowest-friction options for the current deployment model.
- Decide whether the first release is email-only or includes transactional SMS.
- Decide who may approve requests besides Jason and whether an authenticated staff queue is required at launch.

## Current Implementation Snapshot

The appointment form currently:

- accepts appointments for The Mall at Partridge Creek only;
- collects service, date, generated time slot, name, email, phone, and notes;
- calls `GET /api/appointments` for time slots and `POST /api/appointments` for submissions;
- generates every 30-minute interval within configured store hours, excluding closed weekdays and holidays;
- does not check a database or external calendar for existing appointments;
- sends an internal request email and an immediate customer email through SMTP;
- sends the customer calendar links and an `.ics` attachment immediately;
- stores no appointment record, status, notification result, or staff decision.

The current customer communication is inconsistent: the body says the request was received, while the subject and calendar attachment make the visit look confirmed. Two customers can also request the same generated time because availability is not backed by stored reservations.

## Target Customer and Staff Flow

```text
Customer submits request
        |
        v
Pending request saved and slot claimed
        |
        +--> Customer: "Request received — not confirmed yet"
        |
        +--> Jason: "Action needed — review appointment request"
                  |
                  +--> Confirm
                  |      +--> Save confirmed status
                  |      +--> Create/mirror calendar event
                  |      +--> Send confirmed email and optional SMS
                  |
                  +--> Suggest another time
                  |      +--> Customer accepts or selects another time
                  |
                  +--> Decline
                         +--> Release slot
                         +--> Notify customer
```

## Appointment States

Required states:

- `pending_staff_review`
- `confirmed`
- `declined`
- `cancelled`
- `expired`

Recommended follow-up state:

- `reschedule_proposed`

Allowed transitions:

```text
pending_staff_review -> confirmed
pending_staff_review -> declined
pending_staff_review -> expired
pending_staff_review -> reschedule_proposed
reschedule_proposed  -> confirmed
reschedule_proposed  -> declined
confirmed            -> cancelled
```

Each transition must be validated server-side and be idempotent so repeated clicks or retried requests cannot duplicate events or notifications.

## Recommended Data Model

### `appointments`

Suggested fields:

- `id`: UUID primary key
- `reference`: unique public reference such as `APT-...`
- `status`
- `location_slug`
- `resource_id`: showroom or staff resource used for capacity enforcement
- `service_type`
- `requested_start_at`: UTC timestamp
- `requested_end_at`: UTC timestamp
- `scheduled_start_at`: UTC timestamp, nullable until finalized
- `scheduled_end_at`: UTC timestamp, nullable until finalized
- `time_zone`: currently `America/Detroit`
- `customer_name`
- `customer_email`
- `customer_phone`: normalized format
- `notes`
- `hold_expires_at`: nullable, based on the chosen pending-slot policy
- `review_token_hash`: never store a plaintext review token
- `review_token_expires_at`
- `confirmed_at`
- `confirmed_by`
- `declined_at`
- `decline_reason`
- `calendar_event_id`
- `sms_consent_at`
- `sms_consent_version`
- `created_at`
- `updated_at`
- `version`: optimistic-concurrency value

### Slot reservation

For one appointment per fixed 30-minute slot, enforce a unique active reservation on `(resource_id, scheduled_start_at)` or use a separate reservation table with that uniqueness rule.

If service lengths later vary, replace start-time uniqueness with a PostgreSQL non-overlap constraint on the appointment time range. Different start times can otherwise overlap.

### `appointment_notifications`

Use an outbox-style table so saving the appointment does not depend on an email or SMS provider being available.

Suggested fields:

- appointment ID
- event type such as `request_received`, `confirmed`, `declined`, or `reschedule_proposed`
- channel: `email` or `sms`
- recipient
- status: `pending`, `sent`, `delivered`, or `failed`
- attempt count
- next-attempt timestamp
- sent/delivered/failed timestamps
- last error
- unique idempotency key

An optional `appointment_events` audit table can record every state change, actor, timestamp, and non-sensitive reason.

## Availability and Double-Booking Rules

Availability must be calculated from:

1. configured store hours;
2. holiday closures;
3. elapsed same-day times;
4. any configured minimum lead time;
5. active pending holds;
6. proposed-time holds; and
7. confirmed appointments.

The form's availability response is advisory. On submission, the server must claim the slot inside a database transaction. A unique database rule is the final defense against two simultaneous requests.

If the slot is lost between selection and submission, return HTTP `409 Conflict` with refreshed alternatives and ask the customer to choose another time.

## Jason Review Experience

The internal notification email should contain one `Review Request` link. It must not contain state-changing GET links because mail-security scanners may follow links automatically.

The review page should:

- be private, `noindex`, and `no-store`;
- show reference, customer, contact information, service, requested time, and notes;
- show the current state if another action has already occurred;
- offer `Confirm Appointment`, `Suggest Another Time`, and `Decline Request` actions;
- submit every state-changing action using POST;
- show whether the customer notification was sent, is pending, or failed;
- allow a failed notification to be retried without changing appointment status.

For the smallest release, use a cryptographically random, appointment-scoped, expiring, one-time review token and store only its hash. A later staff dashboard should use authenticated staff accounts and retain an audit history.

## Customer Communication

### Form

Keep the primary action request-oriented:

- Button: `Request In-Store Appointment`
- Supporting copy: `Your appointment is not final until our team confirms it.`

### Immediate success state

```text
Request received — not confirmed yet. Jason will review it and we will email you when it is confirmed. Reference: {reference}.
```

### Immediate customer email

- Subject: `We received your appointment request`
- Clearly label the request as pending.
- Include reference and requested details.
- Do not attach a calendar event or use confirmation language.

### Internal email

- Subject: `Action needed: appointment request {reference}`
- Include all request details.
- Include the secure `Review Request` link.

### Confirmed customer email

- Subject: `Your J. Barbaro appointment is confirmed`
- State that Jason or the J. Barbaro team confirmed the visit.
- Include the date, time, `America/Detroit` time-zone label, service, location, directions, and contact information.
- Include Google/Outlook calendar links and the `.ics` attachment for the first time.

### Declined or proposed-time messages

- A decline should explain the next available action: rebook online or call the store.
- A proposed time should remain unconfirmed until the customer accepts it.
- Customer acceptance must also be a secure, idempotent POST transition.

## Calendar Strategy

The current calendar code creates compose links and an `.ics` file but does not write to a staff calendar.

Choose one strategy:

1. **Database is the source of truth:** send `.ics` and calendar links after confirmation, and optionally mirror confirmed events to Jason's calendar.
2. **Google or Outlook is the operational source:** create and update events through that provider's API and synchronize busy times back into site availability.

If Google Calendar is used, create confirmed events with a stable event ID so retries do not create duplicates. Add the customer as an attendee only after confirmation.

## Optional SMS Phase

Email should remain required and authoritative. SMS should be used only for transactional appointment updates.

Before sending texts:

- add a separate, unchecked `Text me updates about this appointment` consent control;
- do not treat the required phone field itself as SMS consent;
- store the consent timestamp, source, and exact disclosure version;
- normalize phone numbers to E.164;
- register the business and messaging campaign as required by the selected provider and US carriers;
- identify J. Barbaro in the first message;
- support STOP and HELP handling;
- record provider message IDs and delivery callbacks;
- keep marketing consent separate from transactional appointment consent;
- update the Privacy Policy and Terms before launch.

Example confirmed text:

```text
J. Barbaro: Jason confirmed your appointment for {date} at {time} at Partridge Creek. Details: {secure_status_url}. Reply STOP to unsubscribe.
```

SMS failure must not undo a confirmed appointment. Email remains the fallback channel.

## Reliability and Security Requirements

- Save the appointment and notification-outbox entries before attempting delivery.
- Retry temporary notification failures with backoff.
- Use idempotency keys to prevent duplicate emails, texts, and calendar events.
- Never place customer PII or appointment data inside action tokens.
- Store only hashes of bearer review tokens.
- Expire and rotate action tokens after use.
- Validate all state changes and service values on the server.
- Add honeypot protection and database-backed rate limiting to the appointment form.
- Record audit events without logging plaintext action tokens or unnecessary PII.
- Define retention and deletion rules for appointment records.
- Update privacy disclosures for durable appointment data and optional SMS consent.
- Make every action safe to retry after network or provider failures.

## Proposed Rollout

### Phase 0: Correct the current semantics

- Change the immediate customer subject from confirmation to request received.
- Remove calendar links and `.ics` from the pre-approval email.
- Add `not confirmed yet` language to the form success state.

This reduces customer confusion but does not create a real confirmation workflow by itself.

### Phase 1: Email approval MVP

- Provision managed Postgres and add migrations.
- Create the appointment repository and state model.
- Make availability database-aware.
- Claim slots transactionally and return `409` on conflicts.
- Save requests before sending notifications.
- Send a pending acknowledgment to the customer.
- Send Jason a secure review link.
- Build the private review page and confirm/decline actions.
- Send confirmation email and calendar artifacts only after approval.
- Add notification outbox processing and retry controls.
- Add concurrency, idempotency, expired-token, and provider-failure tests.

### Phase 2: Rescheduling and customer status

- Let Jason propose an alternate time.
- Let the customer securely accept or reject the proposal.
- Add a customer status page keyed by a separate secure token.
- Add post-confirmation cancellation and rescheduling.
- Update existing calendar events instead of creating duplicates.

### Phase 3: SMS and reminders

- Add SMS consent UI and policy updates.
- Configure the provider and carrier registration.
- Send confirmation, reschedule, decline, cancellation, and reminder messages.
- Process delivery and opt-out webhooks.
- Add email fallback and staff-visible delivery status.

## Expected Code Touchpoints

Existing files likely to change:

- `src/app/api/appointments/route.ts`
- `src/components/appointments/AppointmentForm.tsx`
- `src/lib/email.ts`
- `src/lib/calendar.ts`
- `src/types/submissions.ts`
- `src/app/privacy-policy/page.tsx`
- `src/app/terms-of-use/page.tsx`
- `.env.example`
- `README.md`

New surfaces/modules likely required:

- database schema and migrations
- appointment repository/service layer
- private staff review page
- confirm/decline/reschedule action routes
- customer status/acceptance route for phase 2
- notification outbox processor or scheduled worker
- optional Google/Outlook calendar adapter
- optional SMS adapter and webhook routes

TinaCMS should remain the content editor and should not be used as the appointment database or approval system.

## Acceptance Criteria for the Email MVP

- A submitted request is durably stored before any email is attempted.
- The customer is explicitly told the request is pending.
- Jason can review and confirm or decline from a secure page.
- Opening an email link cannot mutate appointment state.
- Only a valid POST action can confirm or decline.
- Confirmation is idempotent and cannot send duplicate calendar events.
- Only confirmed appointments receive calendar artifacts.
- Occupied or actively held slots are removed from availability.
- Two concurrent requests cannot own the same capacity-limited slot.
- Failed email delivery does not lose or roll back the appointment.
- Jason can see and retry a failed customer notification.
- Expired or reused action links show the current status and a safe recovery path.
- Past dates, elapsed same-day times, invalid services, closed days, and holidays are rejected server-side.
- Automated tests cover state transitions, double submission, concurrency, token expiry, time zones/DST, and notification retry behavior.

## Verification Plan

- Unit-test slot generation, date/time conversion, state transitions, and token validation.
- Integration-test transactional slot claims and concurrent submissions.
- Verify pending, confirmed, declined, expired, and proposed-time email copy.
- Verify no calendar attachment exists before confirmation.
- Verify confirmed calendar events use stable identifiers and correct Detroit time.
- Test email provider failure and retry without duplicate customer messages.
- Test keyboard and mobile usability of the review and customer-status pages.
- Test production builds and route behavior with missing provider configuration.
- If SMS is added, test consent capture, E.164 normalization, STOP/HELP handling, delivery callbacks, and email fallback.

## External References

- Vercel Marketplace storage: https://vercel.com/docs/marketplace-storage
- Google Calendar event creation: https://developers.google.com/workspace/calendar/api/guides/create-events
- Twilio appointment reminders: https://www.twilio.com/docs/messaging/tutorials/appointment-reminders/node
- Twilio A2P 10DLC: https://www.twilio.com/docs/messaging/compliance/a2p-10dlc
- Twilio Messaging Policy: https://www.twilio.com/en-us/legal/messaging-policy

## Explicit Non-Goals for the First Release

- Do not build SMS before consent and carrier requirements are ready.
- Do not use a state-changing GET link in email.
- Do not treat the current generated store-hour intervals as real availability.
- Do not send calendar artifacts before staff confirmation.
- Do not use TinaCMS as operational appointment storage.
- Do not claim an appointment is confirmed merely because the request email was delivered.
