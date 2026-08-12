# TICKETA 2.0 — MILESTONE 1 ARCHITECTURE & TECHNICAL FOUNDATION

---

## EXECUTIVE SUMMARY

Ticketa 2.0 is a unified, production-grade event ticketing and management platform comprising four client applications sharing a single backend infrastructure:
1. **Attendee Website** (Web discovery, purchase, account management)
2. **Attendee Mobile App** (Mobile layout for discovery, digital wallet, QR tickets)
3. **Organizer Dashboard** (Multi-tenant event creation, ticketing, sales analytics, team permissions, payouts)
4. **Staff Check-In Dashboard** (Mobile-optimized QR ticket scanner, check-in validation, real-time attendance stats)

All client applications connect to a unified **Supabase PostgreSQL** database, utilizing **Supabase Auth** for identity management, **Supabase Row Level Security (RLS)** for server-enforced authorization, **Supabase Storage** for media assets, and **Supabase Edge Functions** for privileged server-side payment verification and staff invitations.

---

## 1. PRODUCT ARCHITECTURE

```
                                  ┌───────────────────────────────┐
                                  │      UNIFIED CLIENT LAYER     │
                                  └───────────────┬───────────────┘
                                                  │
         ┌──────────────────┬─────────────────────┼─────────────────────┬──────────────────┐
         │                  │                                           │                  │
 ┌───────▼────────┐ ┌───────▼────────┐                      ┌───────────▼──────────┐ ┌──────▼───────────┐
 │ ATTENDEE WEB   │ │ ATTENDEE MOBILE│                      │ ORGANIZER DASHBOARD  │ │ STAFF DASHBOARD  │
 │ (React / Vite) │ │ (Responsive)   │                      │ (Multi-Tenant Org)   │ │ (Scanner / POS)  │
 └───────┬────────┘ └───────┬────────┘                      └───────────┬──────────┘ └──────┬───────────┘
         │                  │                                           │                   │
         └──────────────────┴─────────────────────┬─────────────────────┴───────────────────┘
                                                  │
                                   ┌──────────────▼──────────────┐
                                   │   SUPABASE BACKEND LAYER    │
                                   └──────────────┬──────────────┘
                                                  │
  ┌───────────────────────┬───────────────────────┼───────────────────────┬───────────────────────┐
  │                       │                       │                       │                       │
┌─▼──────────────┐      ┌─▼──────────────┐      ┌─▼──────────────┐      ┌─▼──────────────┐      ┌─▼──────────────┐
│ SUPABASE AUTH  │      │ POSTGRES (RLS) │      │  EDGE FUNCTIONS│      │STORAGE BUCKETS │      │   AUDIT LOGS   │
│ (JWT / Session)│      │ (18 Entities)  │      │ (Pay / Invite) │      │ (Events/Logos) │      │ (Action Trace) │
└────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘
```

---

## 2. DATABASE SCHEMA & TABLE DEFINITIONS

The system is built upon 18 primary PostgreSQL tables with strict constraints, primary keys, foreign keys, and indexes.

### Core Entities & Key Columns:
1. `profiles`: `id` (UUID PK → `auth.users.id`), `full_name`, `email`, `phone_number`, `avatar_url`, `role` (`user_role` enum), `is_email_verified`.
2. `organizations`: `id` (UUID PK), `name`, `type` (`organizer_type`), `country`, `phone_number`, `logo_url`, `description`, `created_by` (FK → `profiles.id`).
3. `organization_members`: `id` (UUID PK), `organization_id` (FK), `user_id` (FK), `role` (`org_member_role`: `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`).
4. `event_categories`: `id` (UUID PK), `name`, `slug`, `icon_name`.
5. `venues`: `id` (UUID PK), `organization_id` (FK), `name`, `address`, `city`, `country`, `capacity`, `latitude`, `longitude`.
6. `events`: `id` (UUID PK), `organization_id` (FK), `title`, `slug`, `category_id` (FK), `venue_id` (FK), `is_online`, `online_meeting_url`, `banner_image_url`, `start_time`, `end_time`, `status` (`event_status`: `DRAFT`, `PUBLISHED`, `POSTPONED`, `CANCELLED`, `COMPLETED`).
7. `event_staff_assignments`: `id` (UUID PK), `event_id` (FK), `staff_user_id` (FK), `assigned_by` (FK).
8. `ticket_types`: `id` (UUID PK), `event_id` (FK), `name`, `description`, `price`, `currency`, `quantity_available`, `quantity_sold`, `min_per_order`, `max_per_order`.
9. `orders`: `id` (UUID PK), `order_number`, `user_id` (FK), `event_id` (FK), `total_amount`, `currency`, `status` (`order_status`), `payment_reference`, `idempotency_key`.
10. `order_items`: `id` (UUID PK), `order_id` (FK), `ticket_type_id` (FK), `unit_price`, `quantity`, `subtotal`.
11. `payments`: `id` (UUID PK), `order_id` (FK), `provider`, `transaction_reference`, `amount`, `status` (`payment_status`), `raw_payload` (JSONB).
12. `tickets`: `id` (UUID PK), `ticket_code` (Unique), `qr_code_hash` (Unique SHA-256), `order_id` (FK), `event_id` (FK), `ticket_type_id` (FK), `user_id` (FK), `status` (`ticket_status`), `is_checked_in`, `checked_in_at`.
13. `ticket_holders`: `id` (UUID PK), `ticket_id` (FK), `full_name`, `email`, `phone_number`.
14. `refunds`: `id` (UUID PK), `order_id` (FK), `payment_id` (FK), `amount`, `reason`, `requested_by` (FK).
15. `payout_accounts`: `id` (UUID PK), `organization_id` (FK), `account_type` (`payout_account_type`: `INDIVIDUAL`, `BUSINESS`), `account_holder_name`, `bank_name`, `bank_code`, `account_number`, `business_registration_number`, `is_verified`.
16. `payouts`: `id` (UUID PK), `organization_id` (FK), `payout_account_id` (FK), `amount`, `currency`, `status` (`payout_status`), `reference`.
17. `check_ins`: `id` (UUID PK), `ticket_id` (FK), `event_id` (FK), `scanned_by` (FK), `status` (`check_in_status`), `notes`, `scanned_at`.
18. `notifications` & `audit_logs`: Detailed activity tracking, event notifications, and administrative security logs.

---

## 3. USER ROLES & PERMISSIONS MATRIX

| Capability | ATTENDEE | ORGANIZER | STAFF | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Public Event Discovery & Search | ✅ | ✅ | ✅ | ✅ |
| Ticket Purchase & Mobile QR Access | ✅ | ✅ | ❌ | ✅ |
| Create & Manage Organizations | ❌ | ✅ | ❌ | ✅ |
| Create Events & Ticket Types | ❌ | ✅ | ❌ | ✅ |
| Invite Staff to Events | ❌ | ✅ | ❌ | ✅ |
| Scan & Validate QR Tickets | ❌ | ✅ | ✅ | ✅ |
| View Financial Analytics & Payouts | ❌ | ✅ | ❌ | ✅ |
| Global Platform Moderation | ❌ | ❌ | ❌ | ✅ |

---

## 4. SUPABASE AUTH & SIGNUP ARCHITECTURES

### Attendee Signup Flow:
* **Fields**: Full Name, Email Address, Phone Number, Password, Confirm Password.
* Phone number is stored in user profile without mandatory SMS OTP verification.
* Registration fires `supabase.auth.signUp()`, creating the user in `auth.users`, which executes the PostgreSQL trigger `handle_new_user()` to populate `public.profiles`.
* Supabase Auth automatically emits an Email Verification link to the user's inbox. Protected account features require `is_email_verified = TRUE`.

### Organizer 4-Stage Onboarding Flow:
1. **Stage 1 (Credentials)**: Full Name, Email, Password, Confirm Password.
2. **Stage 2 (Organization)**: Organization Name, Type (`INDIVIDUAL`, `BUSINESS`, `NON_PROFIT`, `AGENCY`), Country, Phone Number.
3. **Stage 3 (Payout Setup)**: Account Type, Bank Name, Account Number, Account Holder Name, CAC / Reg Number (optional to complete immediately or skip).
4. **Stage 4 (Completion)**: Account ready → Redirect to Organizer Dashboard.

### Staff Invitation Flow:
* Public registration for Staff is disabled.
* Organizers invite staff via Edge Function `/invite-staff` providing email and event assignment.
* Invited staff receive an email token to set their password and gain restricted scanning access.

### Admin Protection:
* Admin accounts cannot be created via public signups. Role escalation is restricted to database triggers or service-role migrations.

---

## 5. TICKET & CONCURRENCY-PROTECTED QR CHECK-IN ARCHITECTURE

Every ticket receives two identifiers upon payment verification:
1. `ticket_code`: Human-readable identifier (e.g. `TCK-849201`).
2. `qr_code_hash`: Cryptographically signed JSON payload containing `ticket_id`, `event_id`, and a cryptographic hash.

### Atomic QR Scanning Logic:
To eliminate race conditions and double check-ins under poor connectivity or concurrent scanners, check-ins execute via the stored database procedure `check_in_ticket()` using PostgreSQL **`FOR UPDATE` lock**:

```
SCAN QR CODE -> Extract Hash -> Call check_in_ticket(hash, event_id, staff_id)
                                          │
                                   ┌──────▼──────┐
                                   │ SELECT ...  │
                                   │ FOR UPDATE  │ (Atomic Row Lock)
                                   └──────┬──────┘
                                          │
             ┌────────────────────────────┼────────────────────────────┐
             │                            │                            │
      [Invalid / Wrong Event]      [Already Checked In]          [Valid & Unused]
             │                            │                            │
             ▼                            ▼                            ▼
      Reject & Log Audit         Reject Duplicate Scan       Update status='USED'
                                                             Set is_checked_in=TRUE
                                                             Insert Check-in Entry
```

---

## 6. PAYMENT & PAYOUT ARCHITECTURES

### Server-Verified Payment Flow:
1. Client submits checkout request to server/Edge Function.
2. System initializes order in state `PENDING` with a unique `idempotency_key`.
3. Payment provider handles transaction via gateway.
4. Server receives webhook notification signed with HMAC SHA-256.
5. Edge Function verifies payment directly with payment gateway server-to-server.
6. Order status is updated to `PAID`, tickets are minted, QR codes generated.

### Payout Architecture:
* **Individual**: Full Name, Bank, Account Number.
* **Business**: Business/Organization Name, CAC/Tax Reg Info, Bank, Account Number.
* Payouts require staff/admin verification prior to batch disbursement.

---

## 7. PROJECT STRUCTURE

```
/
├── .env.example                # Documented client & server env variables
├── metadata.json               # Applet metadata
├── package.json                # Dependencies (@supabase/supabase-js, react, motion)
├── supabase/
│   ├── schema.sql              # Master database schema, RLS, functions & triggers
│   └── functions/
│       └── README.md           # Edge functions specifications
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # View switcher / milestone foundation demo
│   ├── index.css               # Tailwind CSS rules
│   ├── lib/
│   │   └── supabase.ts         # Supabase client helper
│   ├── types/
│   │   ├── database.ts         # Generated Supabase database TypeScript interfaces
│   │   └── index.ts            # Application domain types
│   ├── services/               # Modular API services (auth, events, tickets, scanner)
│   ├── hooks/                  # Custom React hooks
│   └── components/             # Architectural foundation components
└── DOCS_MILESTONE_1.md         # Comprehensive milestone 1 architectural report
```

---

## 8. DECISIONS REQUIRED FROM PROJECT STAKEHOLDERS

1. **DECISION REQUIRED — Currency & Regional Payment Provider Default**:
   * *Option A*: Paystack (Primary for Nigeria/Africa Naira `NGN` + USD).
   * *Option B*: Stripe (Primary for North America/Europe `USD`/`EUR`/`GBP`).
   * *Option C*: Dual-Provider abstraction layer automatically routing based on event country.

2. **DECISION REQUIRED — Ticket Transferability Policy**:
   * *Option A*: Non-transferable. Only the purchasing account can display and use the digital ticket.
   * *Option B*: Allow ticket transfer via email input, updating `tickets.user_id`.

3. **DECISION REQUIRED — Organizers Commission Fee Model**:
   * *Option A*: Flat fee per ticket (e.g. $1.00 or ₦100 per ticket sold).
   * *Option B*: Percentage fee (e.g. 3.5% + $0.50).
   * *Option C*: Pass platform fee to ticket buyer vs absorb fee by organizer.

---

## 9. ROADMAP FOR UPCOMING MILESTONES

* **MILESTONE 1 (CURRENT)**: Complete System Architecture, Database Schemas, RLS Policies, Supabase Client & Type Infrastructure. *(Completed)*
* **MILESTONE 2**: Attendee Website & Attendee Mobile Experience UI Implementation (Event discovery, search, filtering, checkout modal, digital wallet & QR tickets).
* **MILESTONE 3**: Organizer Dashboard UI Implementation (Multi-stage signup, event builder, ticket inventory manager, orders & attendee tables, sales graphs, payout settings).
* **MILESTONE 4**: Staff Check-In Dashboard UI Implementation (Camera QR code scanner, manual ticket code input, real-time event check-in history, stats counter).
* **MILESTONE 5**: End-to-End Integration, Edge Functions deployment, real-time WebSocket check-in synchronization, final testing & polish.
