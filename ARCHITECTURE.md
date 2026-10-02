# UpgradeCafe — Architecture & System Design

## 1. System Overview

UpgradeCafe is a modular multi-tenant SaaS platform built for the hospitality industry, operated by a single platform company owner (Super Admin).

The platform uses a **Modular Monolith** architecture built on Next.js 16 App Router, TypeScript, Drizzle ORM, Supabase PostgreSQL, Better Auth, and Upstash Redis.

```
Platform (UpgradeCafe)
│
├── Super Admin (Platform Owner)
│   ├── Café Provisioning & Lifecycle
│   ├── SaaS Plans & Operational Limits
│   ├── Offline Billing Ledger
│   └── System Audit Trail
│
└── Café Tenants (Multi-Tenant Isolation)
    ├── Café A (Owner, Staff)
    ├── Café B (Owner, Staff)
    └── Café C (Owner, Staff)
```

---

## 2. Directory & Domain Separation

The codebase is partitioned by business domain to ensure scalability as future modules are added:

```
src/
├── app/
│   ├── admin/                    # Super Admin routes (/admin/*)
│   │   ├── login/
│   │   └── (dashboard)/
│   │       ├── cafes/            # All Cafés, Provisioning, Details, Edit
│   │       ├── plans/            # SaaS Plans & Limits
│   │       ├── payments/         # Offline Billing Ledger
│   │       ├── subscriptions/    # Subscription Oversight
│   │       ├── activity/         # Audit Logs
│   │       └── settings/         # Infrastructure Health
│   ├── api/
│   │   ├── admin/                # Super Admin protected REST APIs
│   │   ├── auth/                 # Better Auth session endpoints
│   │   ├── cafe/                 # [Phase 2] Café tenant APIs
│   │   └── public/               # [Phase 3] Public menu APIs
│   └── globals.css               # Design tokens & CSS variables
├── features/
│   ├── super-admin/              # Super Admin domain logic & components
│   │   ├── components/           # AdminSidebar, CafeTable, PaymentForm, etc.
│   │   ├── services/             # cafe-admin, payment-admin, plan-admin
│   │   ├── schemas/              # Zod validation schemas
│   │   └── types/
│   ├── cafe/                     # [Phase 2] Future Café operations
│   │   ├── owner/                # Dashboard, Analytics, Staff Management
│   │   ├── staff/                # POS, Kitchen display
│   │   ├── menu/                 # Categories, Items, Variants
│   │   ├── orders/               # Live order pipeline
│   │   └── billing/              # Tenant invoice history
│   └── public-menu/              # [Phase 3] Public QR menu
├── components/
│   └── ui/                       # Reusable custom UI system (NO shadcn)
├── server/
│   └── services/
│       └── access-state.service.ts # Central getCafeAccessState() engine
└── lib/
    ├── theme/                    # Design tokens & preset engine
    ├── auth/                     # Better Auth setup
    ├── db/                       # Drizzle ORM schemas & client
    ├── redis/                    # Upstash Redis client
    ├── storage/                  # Cloudflare R2 storage service
    ├── permissions/              # requireAuth, requireSuperAdmin, requireCafeMember
    ├── rate-limit/               # Distributed rate limiting
    ├── errors/                   # Standardized AppError codes
    └── logging/                  # Immutable audit logging
```

---

## 3. Authoritative Source of Truth Hierarchy

1. **PostgreSQL (Supabase)** = **Authoritative Business Source of Truth**. All states, balances, and tenant memberships are resolved from the database.
2. **Better Auth** = **Identity & Session Management**. Cryptographically signed session tokens in secure HTTP-only cookies.
3. **Upstash Redis** = **Infrastructure & Sliding-Window Rate Limiting**. Ephemeral counters, never used as permanent data store.
4. **Cloudflare R2** = **File Storage**. Presigned upload URLs for browser-to-bucket transfers.
5. **Browser / Client** = **Untrusted Client**. No security decisions or tenant access states rely on browser time or state.

---

## 4. Offline Payment & Manual Billing Model

UpgradeCafe does **NOT** use automated payment gateways (Stripe, Razorpay) in this phase.
- Café owners pay the platform owner offline (UPI, Bank Transfer, Cheque, Cash).
- The Super Admin verifies the payment and records it in `/admin/payments`.
- Recording a payment updates the subscription expiry date (`expires_at`) and recalculates tenant access state.
- Grace period is 7 days after expiry before suspension.

---

## 5. Design System & Theming Architecture

- Unified design tokens mapped to CSS variables (`var(--color-primary)`, `var(--color-background)`, etc.).
- Super Admin uses the **Neutral Graphite + Warm Cream + Muted Terracotta (#B85C3A)** palette.
- Strict border radii:
  - Buttons & Inputs: `8px`
  - Cards & Metric blocks: `12px`
  - Modals: `14px`
  - Panels: `16px`
- Theme Engine in `src/lib/theme/` supports presets (Roast, Bakery, Garden, Noir, Play) ready for future café branding.
