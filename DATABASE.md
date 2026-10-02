# UpgradeCafe Database Architecture (Drizzle ORM & PostgreSQL)

## 1. Relational Entity Schema

### `users`
Identity table managed with Better Auth compatibility:
- `id` (text, primary key)
- `name` (text, not null)
- `email` (text, unique, not null)
- `email_verified` (boolean, default false)
- `image` (text)
- `role` (text, default 'USER', indexed): `'SUPER_ADMIN'` | `'USER'`
- `must_change_password` (boolean, default false): requires newly provisioned café owners to replace their temporary password before tenant access
- `created_at` / `updated_at` (timestamp, default now())

### `sessions` & `accounts` & `verifications`
Better Auth core tables storing encrypted session tokens, credentials, and verification requests.

### `cafes`
Tenant organization records:
- `id` (uuid, primary key)
- `name` (text, not null)
- `slug` (text, unique, indexed): Unique sub-path identifier (e.g. `the-roasted-bean`)
- `description` (text)
- `contact_email` (text)
- `phone` (text)
- `address` (text)
- `currency` (text, default 'INR')
- `timezone` (text, default 'Asia/Kolkata')
- `logo_key` / `cover_key` (text): R2 S3 storage keys
- `status` (text, indexed): `'ACTIVE'` | `'GRACE'` | `'SUSPENDED'` | `'ARCHIVED'`
- `manual_status_override` (text, nullable): `'ACTIVE'` | `'SUSPENDED'` | `null`
- `suspension_reason` (text, nullable)
- `archived_at` (timestamp, nullable)
- `created_at` / `updated_at` (timestamp)

### `cafe_memberships`
Multi-tenant association table:
- `id` (uuid, primary key)
- `user_id` (text, foreign key -> `users.id`, indexed)
- `cafe_id` (uuid, foreign key -> `cafes.id`, indexed)
- `role` (text): `'OWNER'` | `'STAFF'` | `'MANAGER'` | `'CASHIER'` | `'KITCHEN'` | `'WAITER'`
- `is_active` (boolean, default true)
- Unique composite index on `(user_id, cafe_id)`

### `plans`
SaaS tiers managed by Super Admin:
- `id` (uuid, primary key)
- `name` (text, not null)
- `slug` (text, unique, indexed)
- `description` (text)
- `monthly_price` / `yearly_price` / `lifetime_price` (integer, in INR)
- `max_branches` (integer, default 1)
- `max_menu_items` (integer, default 100)
- `is_active` (boolean, default true)
- `features` (jsonb array)

### `subscriptions`
Tenant plan allocations:
- `id` (uuid, primary key)
- `cafe_id` (uuid, foreign key -> `cafes.id`, indexed)
- `plan_id` (uuid, foreign key -> `plans.id`)
- `status` (text, indexed): `'ACTIVE'` | `'GRACE'` | `'SUSPENDED'` | `'EXPIRED'` | `'CANCELLED'`
- `billing_cycle` (text): `'MONTHLY'` | `'YEARLY'` | `'LIFETIME'` | `'CUSTOM'`
- `starts_at` (timestamp, not null)
- `expires_at` (timestamp, indexed, not null)
- `grace_period_days` (integer, default 7)
- `notes` (text)

### `payments`
Administrative offline payments ledger:
- `id` (uuid, primary key)
- `cafe_id` (uuid, foreign key -> `cafes.id`, indexed)
- `subscription_id` (uuid, foreign key -> `subscriptions.id`, nullable)
- `amount` (integer, not null)
- `currency` (text, default 'INR')
- `payment_method` (text): `'CASH'` | `'UPI'` | `'BANK_TRANSFER'` | `'CARD'` | `'OTHER'`
- `payment_date` (timestamp, indexed, not null)
- `reference_number` (text): e.g. UPI Ref ID / Cheque No
- `notes` (text)
- `recorded_by_user_id` (text, foreign key -> `users.id`)

### `audit_logs`
Immutable audit trail:
- `id` (uuid, primary key)
- `actor_user_id` (text, foreign key -> `users.id`, indexed)
- `action` (text): e.g. `'ADMIN_CREATED_CAFE'`, `'ADMIN_ADDED_PAYMENT'`
- `entity_type` (text): `'CAFE'`, `'SUBSCRIPTION'`, `'PAYMENT'`, `'PLAN'`
- `entity_id` (text)
- `cafe_id` (uuid, foreign key -> `cafes.id`, nullable, indexed)
- `metadata` (jsonb)
- `ip_address` / `user_agent` (text)
- `created_at` (timestamp, indexed)

---

## 2. Access State Calculation Engine

Access decisions are strictly computed on the server via `getCafeAccessState()`:

```
                  ┌──────────────────────┐
                  │ Cafe Status Check    │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   status == 'ARCHIVED'              manual_status_override
   Blocked (Archived)                         │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                                SUSPENDED            ACTIVE
                                 Blocked             Allowed
                                    │
                                    │ (null override)
                                    ▼
                         ┌──────────────────────┐
                         │ Active Subscription? │
                         └──────────┬───────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
        now <= expires_at    now <= expires_at     now > expires_at
                                 + 7 days              + 7 days
             ACTIVE                  GRACE             SUSPENDED
             Allowed                Allowed             Blocked
```

---

## 3. Database Operations & Migration Scripts

```bash
# Push schema changes directly to PostgreSQL (Supabase)
npm run db:push

# Generate migration files
npm run db:generate

# Execute pending migrations
npm run db:migrate

# Create the initial Super Admin account
npm run db:seed

# Launch Drizzle visual database studio
npm run db:studio
```

Run pending migrations before seeding or starting the updated application. The new migration adds the first-login password flag with a safe `false` default for existing users.
