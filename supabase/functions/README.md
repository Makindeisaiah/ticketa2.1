# TICKETA 2.0 — SUPABASE EDGE FUNCTIONS SPECIFICATIONS

This directory contains the specifications for serverless Edge Functions running in Deno on Supabase Edge Network. These functions perform operations requiring elevated permissions (Service Role Key) or private payment keys.

---

## 1. `/verify-payment`
* **Trigger**: Post-checkout payment webhook or client confirmation call.
* **Method**: `POST`
* **Security**: Verified via payment provider header signature (HMAC SHA-256) or authorization bearer token.
* **Input Payload**:
  ```json
  {
    "payment_reference": "REF-8492049",
    "provider": "PAYSTACK",
    "order_id": "uuid-here",
    "idempotency_key": "IDEMP-9482019"
  }
  ```
* **Process**:
  1. Checks if `idempotency_key` or `payment_reference` has already been processed in `payments` table.
  2. Queries payment provider API server-to-server to verify transaction status (`SUCCESS`).
  3. Updates `orders` table status from `PENDING` to `PAID`.
  4. Generates unique cryptographic QR hashes and records in `tickets` table.
  5. Inserts audit log entry and triggers ticket confirmation notification.
* **Output Payload**:
  ```json
  {
    "success": true,
    "order_id": "uuid-here",
    "status": "PAID",
    "tickets_generated": 2
  }
  ```

---

## 2. `/invite-staff`
* **Trigger**: Organizer invites a staff member to an event.
* **Method**: `POST`
* **Security**: Requires active `ORGANIZER` or `ADMIN` role session.
* **Input Payload**:
  ```json
  {
    "event_id": "uuid-here",
    "organization_id": "uuid-here",
    "email": "staff@example.com",
    "full_name": "John Staff"
  }
  ```
* **Process**:
  1. Verifies requesting user is an `OWNER` or `ADMIN` in `organization_members`.
  2. Uses Supabase Admin API (`supabase.auth.admin.inviteUserByEmail`) to send invitation token.
  3. Creates `profiles` record with role `STAFF`.
  4. Inserts row into `event_staff_assignments`.
  5. Inserts entry into `audit_logs`.

---

## 3. `/process-payout`
* **Trigger**: Scheduled cron job or admin-initiated batch payout.
* **Method**: `POST`
* **Security**: Strict `ADMIN` or secure service key requirement.
* **Input Payload**:
  ```json
  {
    "payout_id": "uuid-here",
    "organization_id": "uuid-here"
  }
  ```
* **Process**:
  1. Fetches verified `payout_accounts` details for the organization.
  2. Verifies account holder and business registration info.
  3. Executes disbursement via banking gateway.
  4. Updates `payouts` status to `PAID` or `FAILED`.
